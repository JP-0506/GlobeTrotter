from rest_framework import permissions
from .models import Trip, TripStop, TripActivity, BudgetItem, TripShare


class IsTripOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a trip to edit/view it.
    """

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'trip'):
            return obj.trip.user == request.user
        elif hasattr(obj, 'stop'):
            return obj.stop.trip.user == request.user
        return False


class IsTripOwnerOrCollaborator(permissions.BasePermission):
    """
    Custom permission to allow owners and shared collaborators to access a trip:
    - Safe methods (GET, HEAD, OPTIONS): Owner, Collaborators (view or edit), or Public trips.
    - Write methods (POST, PUT, PATCH, DELETE): Owner or Collaborators with 'edit' permission.
    """

    def has_object_permission(self, request, view, obj):
        # Resolve the trip instance from the object
        trip = None
        if isinstance(obj, Trip):
            trip = obj
        elif hasattr(obj, 'trip'):
            trip = obj.trip
        elif hasattr(obj, 'stop') and hasattr(obj.stop, 'trip'):
            trip = obj.stop.trip

        if not trip:
            return False

        # Owner has full access
        if trip.user == request.user:
            return True

        # Public trips allow safe methods
        if trip.is_public and request.method in permissions.SAFE_METHODS:
            return True

        # Check TripShare permissions for authenticated user
        if not request.user or not request.user.is_authenticated:
            return False

        share = TripShare.objects.filter(trip=trip, shared_with_user=request.user).first()
        if not share:
            return False

        if request.method in permissions.SAFE_METHODS:
            return True  # 'view' or 'edit' both allow read

        # Write operations require 'edit' permission
        return share.permission == 'edit'


class IsAdminUserCustom(permissions.BasePermission):
    """
    Custom permission to allow only system administrators (is_admin, is_staff, is_superuser).
    """

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_admin or request.user.is_staff or request.user.is_superuser)
        )
