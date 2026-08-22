from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Sum
from .models import (
    User, City, Activity, Trip, TripStop, TripActivity,
    BudgetItem, SavedDestination, TripShare, TripCopy
)


# ==============================================================================
# 1. User & Auth Serializers
# ==============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Public user serializer representation."""
    class Meta:
        model = User
        fields = [
            'user_id', 'name', 'email', 'photo_url',
            'language_pref', 'is_admin', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user_id', 'is_admin', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering a new user."""
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['user_id', 'name', 'email', 'password', 'photo_url', 'language_pref']
        read_only_fields = ['user_id']

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            name=validated_data['name'],
            password=validated_data['password'],
            photo_url=validated_data.get('photo_url', None),
            language_pref=validated_data.get('language_pref', 'en'),
        )


class LoginSerializer(serializers.Serializer):
    """Serializer for user authentication via email & password."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=6, write_only=True)


# ==============================================================================
# 2. City & Activity Serializers
# ==============================================================================

class ActivitySerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source='city.name', read_only=True)
    city_country = serializers.CharField(source='city.country', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'activity_id', 'city', 'city_name', 'city_country',
            'name', 'description', 'category', 'cost',
            'duration_minutes', 'image_url'
        ]


class CitySerializer(serializers.ModelSerializer):
    activities_count = serializers.IntegerField(source='activities.count', read_only=True)
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = City
        fields = [
            'city_id', 'name', 'country', 'region',
            'cost_index', 'popularity', 'latitude', 'longitude',
            'image_url', 'activities_count', 'is_saved'
        ]

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return SavedDestination.objects.filter(user=request.user, city=obj).exists()
        return False


class CityDetailSerializer(CitySerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta(CitySerializer.Meta):
        fields = CitySerializer.Meta.fields + ['activities']


class SavedDestinationSerializer(serializers.ModelSerializer):
    city_details = CitySerializer(source='city', read_only=True)

    class Meta:
        model = SavedDestination
        fields = ['id', 'user', 'city', 'city_details', 'saved_at']
        read_only_fields = ['id', 'user', 'saved_at']


# ==============================================================================
# 3. Trip Activities & Stops Serializers
# ==============================================================================

class TripActivitySerializer(serializers.ModelSerializer):
    activity_details = ActivitySerializer(source='activity', read_only=True)
    effective_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = TripActivity
        fields = [
            'trip_activity_id', 'stop', 'activity', 'activity_details',
            'scheduled_date', 'start_time', 'cost_override',
            'sequence_order', 'effective_cost'
        ]

    def validate(self, attrs):
        stop = attrs.get('stop') or (self.instance.stop if self.instance else None)
        activity = attrs.get('activity') or (self.instance.activity if self.instance else None)
        scheduled_date = attrs.get('scheduled_date') or (self.instance.scheduled_date if self.instance else None)

        if stop and activity and activity.city_id != stop.city_id:
            raise serializers.ValidationError({
                'activity': f"Activity must belong to the stop's city ({stop.city.name})."
            })

        if stop and scheduled_date:
            if scheduled_date < stop.arrival_date or scheduled_date > stop.departure_date:
                raise serializers.ValidationError({
                    'scheduled_date': f"Scheduled date must fall within stop dates ({stop.arrival_date} to {stop.departure_date})."
                })

        return attrs


class TripStopSerializer(serializers.ModelSerializer):
    city_details = CitySerializer(source='city', read_only=True)
    activities = TripActivitySerializer(many=True, read_only=True)

    class Meta:
        model = TripStop
        fields = [
            'stop_id', 'trip', 'city', 'city_details',
            'sequence_order', 'arrival_date', 'departure_date',
            'notes', 'activities'
        ]

    def validate(self, attrs):
        trip = attrs.get('trip') or (self.instance.trip if self.instance else None)
        arrival_date = attrs.get('arrival_date') or (self.instance.arrival_date if self.instance else None)
        departure_date = attrs.get('departure_date') or (self.instance.departure_date if self.instance else None)

        if arrival_date and departure_date and departure_date < arrival_date:
            raise serializers.ValidationError({
                'departure_date': 'Departure date cannot be earlier than arrival date.'
            })

        if trip and arrival_date and (arrival_date < trip.start_date or arrival_date > trip.end_date):
            raise serializers.ValidationError({
                'arrival_date': f"Arrival date must fall within trip dates ({trip.start_date} to {trip.end_date})."
            })

        if trip and departure_date and (departure_date < trip.start_date or departure_date > trip.end_date):
            raise serializers.ValidationError({
                'departure_date': f"Departure date must fall within trip dates ({trip.start_date} to {trip.end_date})."
            })

        return attrs


# ==============================================================================
# 4. Budget Item Serializers
# ==============================================================================

class BudgetItemSerializer(serializers.ModelSerializer):
    stop_city_name = serializers.CharField(source='stop.city.name', read_only=True, allow_null=True)

    class Meta:
        model = BudgetItem
        fields = [
            'budget_item_id', 'trip', 'category', 'description',
            'amount', 'expense_date', 'stop', 'stop_city_name'
        ]


# ==============================================================================
# 5. Trip Shares & Copies Serializers
# ==============================================================================

class TripShareSerializer(serializers.ModelSerializer):
    shared_with_user_email = serializers.EmailField(source='shared_with_user.email', read_only=True)
    shared_with_user_name = serializers.CharField(source='shared_with_user.name', read_only=True)
    user_email_input = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = TripShare
        fields = [
            'id', 'trip', 'shared_with_user', 'shared_with_user_email',
            'shared_with_user_name', 'user_email_input', 'permission', 'shared_at'
        ]
        read_only_fields = ['id', 'shared_with_user', 'shared_at']

    def create(self, validated_data):
        email_input = validated_data.pop('user_email_input', None)
        trip = validated_data['trip']
        user = None

        if email_input:
            try:
                user = User.objects.get(email=email_input)
            except User.DoesNotExist:
                raise serializers.ValidationError({'user_email_input': f"User with email '{email_input}' not found."})
        elif 'shared_with_user' in validated_data:
            user = validated_data['shared_with_user']
        else:
            raise serializers.ValidationError({'user_email_input': 'Recipient email is required.'})

        if user == trip.user:
            raise serializers.ValidationError({'user_email_input': 'You cannot share a trip with yourself.'})

        validated_data['shared_with_user'] = user
        share, created = TripShare.objects.update_or_create(
            trip=trip,
            shared_with_user=user,
            defaults={'permission': validated_data.get('permission', 'view')}
        )
        return share


class TripCopySerializer(serializers.ModelSerializer):
    original_trip_name = serializers.CharField(source='original_trip.name', read_only=True)
    copied_trip_name = serializers.CharField(source='copied_trip.name', read_only=True)
    copied_by_user_name = serializers.CharField(source='copied_by_user.name', read_only=True)

    class Meta:
        model = TripCopy
        fields = [
            'id', 'original_trip', 'original_trip_name',
            'copied_trip', 'copied_trip_name',
            'copied_by_user', 'copied_by_user_name', 'copied_at'
        ]
        read_only_fields = ['id', 'copied_at']


# ==============================================================================
# 6. Trip Serializers (List, Detail, Create/Update)
# ==============================================================================

class TripListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    stops_count = serializers.IntegerField(source='stops.count', read_only=True)
    total_spent = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'trip_id', 'user', 'user_name', 'user_email',
            'name', 'description', 'start_date', 'end_date',
            'budget_limit', 'cover_photo_url', 'is_public',
            'public_slug', 'stops_count', 'total_spent',
            'is_owner', 'created_at', 'updated_at'
        ]
        read_only_fields = ['trip_id', 'user', 'public_slug', 'created_at', 'updated_at']

    def get_total_spent(self, obj):
        items_total = obj.budget_items.aggregate(total=Sum('amount'))['total'] or 0
        return float(items_total)

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.user_id == request.user.user_id
        return False


class TripDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    stops = TripStopSerializer(many=True, read_only=True)
    budget_items = BudgetItemSerializer(many=True, read_only=True)
    shares = TripShareSerializer(many=True, read_only=True)
    budget_summary = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    user_permission = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'trip_id', 'user', 'name', 'description',
            'start_date', 'end_date', 'budget_limit',
            'cover_photo_url', 'is_public', 'public_slug',
            'stops', 'budget_items', 'shares',
            'budget_summary', 'is_owner', 'user_permission',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['trip_id', 'user', 'public_slug', 'created_at', 'updated_at']

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return obj.user_id == request.user.user_id
        return False

    def get_user_permission(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return 'public_view' if obj.is_public else None
        if obj.user_id == request.user.user_id:
            return 'owner'
        share = obj.shares.filter(shared_with_user=request.user).first()
        if share:
            return share.permission
        return 'public_view' if obj.is_public else None

    def get_budget_summary(self, obj):
        budget_limit = float(obj.budget_limit or 0)
        items = obj.budget_items.all()

        # Group actual expenses by category
        categories = {'transport': 0.0, 'stay': 0.0, 'activities': 0.0, 'meals': 0.0, 'other': 0.0}
        total_items_spent = 0.0

        for item in items:
            cat = item.category if item.category in categories else 'other'
            val = float(item.amount)
            categories[cat] += val
            total_items_spent += val

        # Calculate scheduled activity costs (from TripActivity)
        activities_scheduled_cost = 0.0
        for stop in obj.stops.all():
            for act in stop.activities.all():
                activities_scheduled_cost += float(act.effective_cost or 0)

        total_spent = total_items_spent
        remaining = budget_limit - total_spent if budget_limit > 0 else 0

        return {
            'budget_limit': budget_limit,
            'total_spent': total_spent,
            'remaining': remaining,
            'is_over_budget': total_spent > budget_limit if budget_limit > 0 else False,
            'categories': categories,
            'activities_scheduled_cost': activities_scheduled_cost,
        }


class TripCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            'trip_id', 'name', 'description', 'start_date',
            'end_date', 'budget_limit', 'cover_photo_url',
            'is_public', 'public_slug'
        ]
        read_only_fields = ['trip_id', 'public_slug']

    def validate(self, attrs):
        start_date = attrs.get('start_date') or (self.instance.start_date if self.instance else None)
        end_date = attrs.get('end_date') or (self.instance.end_date if self.instance else None)

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be earlier than start date.'
            })
        return attrs
