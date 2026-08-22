from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum
from django.utils import timezone
from datetime import date

from .models import (
    User, City, Activity, Trip, TripStop, TripActivity,
    BudgetItem, SavedDestination, TripShare, TripCopy
)
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    CitySerializer, CityDetailSerializer, ActivitySerializer, SavedDestinationSerializer,
    TripListSerializer, TripDetailSerializer, TripCreateUpdateSerializer,
    TripStopSerializer, TripActivitySerializer, BudgetItemSerializer,
    TripShareSerializer, TripCopySerializer
)
from .permissions import IsTripOwner, IsTripOwnerOrCollaborator, IsAdminUserCustom


# ==============================================================================
# Helper functions
# ==============================================================================

def get_tokens_for_user(user):
    """Generate SimpleJWT access and refresh tokens for user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def api_response(success=True, data=None, error=None, errors=None, status_code=status.HTTP_200_OK):
    """Consistent JSON response format { success, data, error }."""
    payload = {'success': success}
    if data is not None:
        payload['data'] = data
    if error is not None:
        payload['error'] = error
    if errors is not None:
        payload['errors'] = errors
    return Response(payload, status=status_code)


# ==============================================================================
# 1. Authentication & Profile Views
# ==============================================================================

class RegisterView(APIView):
    """
    POST /api/auth/register
    Creates a new user account and returns JWT tokens + user profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                data={
                    'token': tokens['access'],
                    'tokens': tokens,
                    'user': user_data
                },
                status_code=status.HTTP_201_CREATED
            )
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Registration failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    POST /api/auth/login
    Authenticates user and returns JWT tokens + user profile.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return api_response(
                success=True,
                data={
                    'token': tokens['access'],
                    'tokens': tokens,
                    'user': user_data
                }
            )
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Login failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class MeView(APIView):
    """
    GET /api/auth/me
    PUT /api/auth/me
    PATCH /api/auth/me
    Retrieves or updates current logged-in user profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return api_response(success=True, data=serializer.data)

    def put(self, request):
        return self._update(request, partial=False)

    def patch(self, request):
        return self._update(request, partial=True)

    def _update(self, request, partial=False):
        serializer = UserSerializer(request.user, data=request.data, partial=partial)
        if serializer.is_valid():
            user = serializer.save()
            return api_response(success=True, data=UserSerializer(user).data)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Update failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return api_response(
                    success=False,
                    error='Incorrect current password.',
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return api_response(success=True, data={'message': 'Password changed successfully.'})
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Validation error.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )


# ==============================================================================
# 2. Trip ViewSet & Operations
# ==============================================================================

class TripViewSet(viewsets.ModelViewSet):
    """
    CRUD ViewSet for Trips:
    - list: all trips owned by or shared with user
    - create: create a new trip owned by user
    - retrieve: trip detail + nested stops + itinerary + budget
    - update/patch: owner or 'edit' permission
    - destroy: owner only
    """
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerOrCollaborator]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Trip.objects.none()

        # User's own trips OR trips shared with them
        qs = Trip.objects.filter(
            Q(user=user) | Q(shares__shared_with_user=user)
        ).distinct()

        # Filtering by status: upcoming, past, current
        trip_status = self.request.query_params.get('status')
        today = date.today()
        if trip_status == 'upcoming':
            qs = qs.filter(start_date__gt=today)
        elif trip_status == 'past':
            qs = qs.filter(end_date__lt=today)
        elif trip_status == 'current':
            qs = qs.filter(start_date__lte=today, end_date__gte=today)

        # Search query
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

        return qs.order_by('-start_date')

    def get_serializer_class(self):
        if self.action == 'list':
            return TripListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TripCreateUpdateSerializer
        return TripDetailSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return api_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            trip = serializer.save(user=request.user)
            detail_serializer = TripDetailSerializer(trip, context={'request': request})
            return api_response(success=True, data=detail_serializer.data, status_code=status.HTTP_201_CREATED)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Trip creation failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return api_response(success=True, data=serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            trip = serializer.save()
            detail_serializer = TripDetailSerializer(trip, context={'request': request})
            return api_response(success=True, data=detail_serializer.data)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Update failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return api_response(
                success=False,
                error='Only the trip owner can delete this trip.',
                status_code=status.HTTP_403_FORBIDDEN
            )
        self.perform_destroy(instance)
        return api_response(success=True, data={'message': 'Trip deleted successfully.'})

    @action(detail=False, methods=['get'], url_path='public/(?P<slug>[^/.]+)', permission_classes=[permissions.AllowAny])
    def public_by_slug(self, request, slug=None):
        """GET /api/trips/public/:slug — View a public shared itinerary."""
        trip = get_object_or_404(Trip, public_slug=slug, is_public=True)
        serializer = TripDetailSerializer(trip, context={'request': request})
        return api_response(success=True, data=serializer.data)

    @action(detail=True, methods=['post'], url_path='copy', permission_classes=[permissions.IsAuthenticated])
    def copy(self, request, pk=None):
        """
        POST /api/trips/:id/copy
        Deep copies a trip (and its stops + scheduled activities) to current user's library.
        """
        original_trip = self.get_object()

        # Check access permission: public OR user has read access
        if not original_trip.is_public and original_trip.user != request.user:
            has_share = TripShare.objects.filter(trip=original_trip, shared_with_user=request.user).exists()
            if not has_share:
                return api_response(
                    success=False,
                    error='You do not have permission to copy this trip.',
                    status_code=status.HTTP_403_FORBIDDEN
                )

        # Create new copied trip
        new_trip = Trip.objects.create(
            user=request.user,
            name=f"Copy of {original_trip.name}",
            description=original_trip.description,
            start_date=original_trip.start_date,
            end_date=original_trip.end_date,
            budget_limit=original_trip.budget_limit,
            cover_photo_url=original_trip.cover_photo_url,
            is_public=False
        )

        # Copy all stops and their activities
        for stop in original_trip.stops.all():
            new_stop = TripStop.objects.create(
                trip=new_trip,
                city=stop.city,
                sequence_order=stop.sequence_order,
                arrival_date=stop.arrival_date,
                departure_date=stop.departure_date,
                notes=stop.notes
            )
            for act in stop.activities.all():
                TripActivity.objects.create(
                    stop=new_stop,
                    activity=act.activity,
                    scheduled_date=act.scheduled_date,
                    start_time=act.start_time,
                    cost_override=act.cost_override,
                    sequence_order=act.sequence_order
                )

        # Record copy lineage
        TripCopy.objects.create(
            original_trip=original_trip,
            copied_trip=new_trip,
            copied_by_user=request.user
        )

        detail = TripDetailSerializer(new_trip, context={'request': request}).data
        return api_response(
            success=True,
            data=detail,
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get', 'post'], url_path='shares', permission_classes=[permissions.IsAuthenticated])
    def shares(self, request, pk=None):
        """GET /api/trips/:id/shares OR POST /api/trips/:id/shares"""
        trip = self.get_object()
        if trip.user != request.user:
            return api_response(
                success=False,
                error='Only the trip owner can manage collaborator shares.',
                status_code=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            shares = TripShare.objects.filter(trip=trip)
            serializer = TripShareSerializer(shares, many=True)
            return api_response(success=True, data=serializer.data)

        elif request.method == 'POST':
            data = request.data.copy()
            data['trip'] = trip.trip_id
            serializer = TripShareSerializer(data=data)
            if serializer.is_valid():
                share = serializer.save()
                return api_response(
                    success=True,
                    data=TripShareSerializer(share).data,
                    status_code=status.HTTP_201_CREATED
                )
            return api_response(
                success=False,
                error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Failed to share trip.',
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )


# ==============================================================================
# 3. Trip Stops ViewSet
# ==============================================================================

class TripStopViewSet(viewsets.ModelViewSet):
    """
    CRUD for Trip Stops (Itinerary builder destinations).
    """
    serializer_class = TripStopSerializer
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerOrCollaborator]

    def get_queryset(self):
        user = self.request.user
        trip_id = self.request.query_params.get('trip_id')
        qs = TripStop.objects.filter(
            Q(trip__user=user) | Q(trip__shares__shared_with_user=user)
        ).distinct()
        if trip_id:
            qs = qs.filter(trip_id=trip_id)
        return qs.order_by('sequence_order')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check permission on target trip
            trip = serializer.validated_data['trip']
            if trip.user != request.user:
                share = TripShare.objects.filter(trip=trip, shared_with_user=request.user, permission='edit').exists()
                if not share:
                    return api_response(
                        success=False,
                        error='You do not have edit permission for this trip.',
                        status_code=status.HTTP_403_FORBIDDEN
                    )
            stop = serializer.save()
            return api_response(success=True, data=TripStopSerializer(stop).data, status_code=status.HTTP_201_CREATED)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Validation error.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(success=True, data=serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            stop = serializer.save()
            return api_response(success=True, data=TripStopSerializer(stop).data)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Update failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_response(success=True, data={'message': 'Stop deleted successfully.'})

    @action(detail=False, methods=['post'], url_path='reorder', permission_classes=[permissions.IsAuthenticated])
    def reorder(self, request):
        """
        POST /api/stops/reorder
        Payload: { "stops": [ { "stop_id": 1, "sequence_order": 1 }, ... ] }
        """
        stops_data = request.data.get('stops', [])
        if not isinstance(stops_data, list):
            return api_response(success=False, error='Payload must contain a "stops" list.', status_code=status.HTTP_400_BAD_REQUEST)

        updated = []
        for item in stops_data:
            stop_id = item.get('stop_id')
            seq = item.get('sequence_order')
            if stop_id is not None and seq is not None:
                stop = TripStop.objects.filter(stop_id=stop_id).first()
                if stop and (stop.trip.user == request.user or TripShare.objects.filter(trip=stop.trip, shared_with_user=request.user, permission='edit').exists()):
                    stop.sequence_order = seq
                    stop.save()
                    updated.append(stop_id)

        return api_response(success=True, data={'message': f'Reordered {len(updated)} stops.'})


# ==============================================================================
# 4. Trip Activity ViewSet
# ==============================================================================

class TripActivityViewSet(viewsets.ModelViewSet):
    """
    CRUD for scheduled activities attached to a stop.
    """
    serializer_class = TripActivitySerializer
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerOrCollaborator]

    def get_queryset(self):
        user = self.request.user
        stop_id = self.request.query_params.get('stop_id')
        trip_id = self.request.query_params.get('trip_id')
        qs = TripActivity.objects.filter(
            Q(stop__trip__user=user) | Q(stop__trip__shares__shared_with_user=user)
        ).distinct()
        if stop_id:
            qs = qs.filter(stop_id=stop_id)
        if trip_id:
            qs = qs.filter(stop__trip_id=trip_id)
        return qs.order_by('scheduled_date', 'sequence_order')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            stop = serializer.validated_data['stop']
            trip = stop.trip
            if trip.user != request.user:
                share = TripShare.objects.filter(trip=trip, shared_with_user=request.user, permission='edit').exists()
                if not share:
                    return api_response(
                        success=False,
                        error='You do not have permission to edit this trip.',
                        status_code=status.HTTP_403_FORBIDDEN
                    )
            activity = serializer.save()
            return api_response(success=True, data=TripActivitySerializer(activity).data, status_code=status.HTTP_201_CREATED)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Validation error.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(success=True, data=serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            activity = serializer.save()
            return api_response(success=True, data=TripActivitySerializer(activity).data)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Update failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_response(success=True, data={'message': 'Scheduled activity removed.'})


# ==============================================================================
# 5. Cities & Activities (Destinations) ViewSets
# ==============================================================================

class CityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Search, list and view master destination cities.
    """
    permission_classes = [permissions.AllowAny]
    queryset = City.objects.all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CityDetailSerializer
        return CitySerializer

    def get_queryset(self):
        qs = City.objects.all()
        search = self.request.query_params.get('search')
        country = self.request.query_params.get('country')
        region = self.request.query_params.get('region')
        max_cost = self.request.query_params.get('max_cost')
        sort = self.request.query_params.get('sort', '-popularity')

        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(country__icontains=search) | Q(region__icontains=search))
        if country:
            qs = qs.filter(country__iexact=country)
        if region:
            qs = qs.filter(region__iexact=region)
        if max_cost:
            try:
                qs = qs.filter(cost_index__lte=float(max_cost))
            except ValueError:
                pass

        if sort in ['popularity', '-popularity', 'name', '-name', 'cost_index', '-cost_index']:
            qs = qs.order_by(sort)
        else:
            qs = qs.order_by('-popularity', 'name')

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return api_response(success=True, data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, context={'request': request})
        return api_response(success=True, data=serializer.data)

    @action(detail=False, methods=['get'], url_path='recommended')
    def recommended(self, request):
        """GET /api/cities/recommended — Top recommended cities based on popularity."""
        limit = int(request.query_params.get('limit', 8))
        cities = City.objects.order_by('-popularity')[:limit]
        serializer = CitySerializer(cities, many=True, context={'request': request})
        return api_response(success=True, data=serializer.data)

    @action(detail=True, methods=['get'], url_path='activities')
    def activities(self, request, pk=None):
        """GET /api/cities/:id/activities — Activities in a city."""
        city = self.get_object()
        category = request.query_params.get('category')
        qs = city.activities.all()
        if category:
            qs = qs.filter(category__iexact=category)
        serializer = ActivitySerializer(qs, many=True)
        return api_response(success=True, data=serializer.data)


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Search and view all activities across all cities.
    """
    serializer_class = ActivitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Activity.objects.select_related('city').all()
        city_id = self.request.query_params.get('city_id')
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        max_cost = self.request.query_params.get('max_cost')

        if city_id:
            qs = qs.filter(city_id=city_id)
        if category:
            qs = qs.filter(category__iexact=category)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search) | Q(city__name__icontains=search))
        if max_cost:
            try:
                qs = qs.filter(cost__lte=float(max_cost))
            except ValueError:
                pass

        return qs.order_by('city__name', 'name')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(success=True, data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(success=True, data=serializer.data)


class SavedDestinationViewSet(viewsets.ModelViewSet):
    """
    CRUD for User's Saved / Favorited Destinations.
    """
    serializer_class = SavedDestinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SavedDestination.objects.filter(user=self.request.user).select_related('city')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return api_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        city_id = request.data.get('city_id') or request.data.get('city')
        if not city_id:
            return api_response(success=False, error='city_id is required.', status_code=status.HTTP_400_BAD_REQUEST)

        city = get_object_or_404(City, city_id=city_id)
        saved_dest, created = SavedDestination.objects.get_or_create(user=request.user, city=city)
        serializer = self.get_serializer(saved_dest, context={'request': request})
        return api_response(
            success=True,
            data=serializer.data,
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.user != request.user:
            return api_response(success=False, error='Forbidden.', status_code=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return api_response(success=True, data={'message': 'Destination unsaved.'})

    @action(detail=False, methods=['delete'], url_path='unsave')
    def unsave(self, request):
        """DELETE /api/saved-destinations/unsave?city_id=:id"""
        city_id = request.query_params.get('city_id') or request.data.get('city_id')
        if not city_id:
            return api_response(success=False, error='city_id is required.', status_code=status.HTTP_400_BAD_REQUEST)
        SavedDestination.objects.filter(user=request.user, city_id=city_id).delete()
        return api_response(success=True, data={'message': 'City removed from saved destinations.'})


# ==============================================================================
# 6. Budget Views
# ==============================================================================

class BudgetItemViewSet(viewsets.ModelViewSet):
    """
    CRUD for Budget Items (expenses) on a Trip.
    """
    serializer_class = BudgetItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerOrCollaborator]

    def get_queryset(self):
        user = self.request.user
        trip_id = self.request.query_params.get('trip_id')
        qs = BudgetItem.objects.filter(
            Q(trip__user=user) | Q(trip__shares__shared_with_user=user)
        ).distinct()
        if trip_id:
            qs = qs.filter(trip_id=trip_id)
        return qs.order_by('-expense_date', '-budget_item_id')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return api_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            trip = serializer.validated_data['trip']
            if trip.user != request.user:
                share = TripShare.objects.filter(trip=trip, shared_with_user=request.user, permission='edit').exists()
                if not share:
                    return api_response(
                        success=False,
                        error='You do not have edit permissions for this trip.',
                        status_code=status.HTTP_403_FORBIDDEN
                    )
            item = serializer.save()
            return api_response(success=True, data=BudgetItemSerializer(item).data, status_code=status.HTTP_201_CREATED)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Validation error.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return api_response(success=True, data=serializer.data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            item = serializer.save()
            return api_response(success=True, data=BudgetItemSerializer(item).data)
        return api_response(
            success=False,
            error=next(iter(serializer.errors.values()))[0] if serializer.errors else 'Update failed.',
            errors=serializer.errors,
            status_code=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return api_response(success=True, data={'message': 'Budget item removed.'})


class TripBudgetSummaryView(APIView):
    """
    GET /api/trips/:id/budget
    Returns full budget breakdown, category rollup, activity costs, and balance.
    """
    permission_classes = [permissions.IsAuthenticated, IsTripOwnerOrCollaborator]

    def get(self, request, pk=None):
        trip = get_object_or_404(Trip, trip_id=pk)

        # Check permission
        if trip.user != request.user and not trip.is_public:
            has_share = TripShare.objects.filter(trip=trip, shared_with_user=request.user).exists()
            if not has_share:
                return api_response(success=False, error='Forbidden.', status_code=status.HTTP_403_FORBIDDEN)

        budget_limit = float(trip.budget_limit or 0)
        items = trip.budget_items.all()

        # Category totals from line items
        categories = {
            'transport': {'label': 'Transport', 'spent': 0.0, 'items_count': 0},
            'stay': {'label': 'Stay / Accommodation', 'spent': 0.0, 'items_count': 0},
            'activities': {'label': 'Activities', 'spent': 0.0, 'items_count': 0},
            'meals': {'label': 'Meals & Dining', 'spent': 0.0, 'items_count': 0},
            'other': {'label': 'Other', 'spent': 0.0, 'items_count': 0},
        }

        total_actual_spent = 0.0
        for item in items:
            cat = item.category if item.category in categories else 'other'
            val = float(item.amount)
            categories[cat]['spent'] += val
            categories[cat]['items_count'] += 1
            total_actual_spent += val

        # Activity costs rollup from scheduled activities
        scheduled_activities_cost = 0.0
        scheduled_activities_list = []
        for stop in trip.stops.all():
            for act in stop.activities.all():
                effective_cost = float(act.effective_cost or 0)
                scheduled_activities_cost += effective_cost
                scheduled_activities_list.append({
                    'trip_activity_id': act.trip_activity_id,
                    'activity_name': act.activity.name,
                    'stop_city': stop.city.name,
                    'scheduled_date': act.scheduled_date,
                    'effective_cost': effective_cost,
                })

        remaining_budget = budget_limit - total_actual_spent if budget_limit > 0 else 0
        budget_used_percentage = round((total_actual_spent / budget_limit * 100), 1) if budget_limit > 0 else 0

        data = {
            'trip_id': trip.trip_id,
            'trip_name': trip.name,
            'budget_limit': budget_limit,
            'total_actual_spent': total_actual_spent,
            'remaining_budget': remaining_budget,
            'budget_used_percentage': budget_used_percentage,
            'is_over_budget': total_actual_spent > budget_limit if budget_limit > 0 else False,
            'category_breakdown': categories,
            'scheduled_activities_cost': scheduled_activities_cost,
            'scheduled_activities': scheduled_activities_list,
            'budget_items': BudgetItemSerializer(items, many=True).data
        }

        return api_response(success=True, data=data)


# ==============================================================================
# 7. Dashboard Summary View
# ==============================================================================

class DashboardSummaryView(APIView):
    """
    GET /api/dashboard/summary
    Aggregated dashboard stats for current user:
    - total trips, upcoming trips, past trips
    - next upcoming trip preview
    - total budget allocated
    - saved destinations count
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()

        trips_qs = Trip.objects.filter(Q(user=user) | Q(shares__shared_with_user=user)).distinct()
        total_trips = trips_qs.count()

        upcoming_trips = trips_qs.filter(start_date__gte=today).order_by('start_date')
        past_trips = trips_qs.filter(end_date__lt=today).order_by('-end_date')

        next_trip = upcoming_trips.first()
        next_trip_data = TripDetailSerializer(next_trip, context={'request': request}).data if next_trip else None

        total_budget_allocated = trips_qs.filter(user=user).aggregate(total=Sum('budget_limit'))['total'] or 0
        saved_dest_count = SavedDestination.objects.filter(user=user).count()

        # Recommended destinations
        recommended_cities = City.objects.order_by('-popularity')[:4]

        return api_response(
            success=True,
            data={
                'user': UserSerializer(user).data,
                'stats': {
                    'total_trips': total_trips,
                    'upcoming_trips_count': upcoming_trips.count(),
                    'past_trips_count': past_trips.count(),
                    'total_budget_allocated': float(total_budget_allocated),
                    'saved_destinations_count': saved_dest_count,
                },
                'next_trip': next_trip_data,
                'recent_trips': TripListSerializer(trips_qs.order_by('-start_date')[:5], many=True, context={'request': request}).data,
                'recommended_destinations': CitySerializer(recommended_cities, many=True, context={'request': request}).data
            }
        )
