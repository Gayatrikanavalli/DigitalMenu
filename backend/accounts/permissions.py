from rest_framework import permissions
from rest_framework.exceptions import NotAuthenticated
from accounts.models import get_staff_profile


def _require_authenticated(request):
    """Raise 401 if the request user is not authenticated."""
    if not request.user or not request.user.is_authenticated:
        raise NotAuthenticated()


class IsStaff(permissions.BasePermission):
    """Authenticated user with a StaffProfile (manager or kitchen staff)."""
    message = 'Staff portal access required.'

    def has_permission(self, request, view):
        _require_authenticated(request)
        return get_staff_profile(request.user) is not None


class IsManager(permissions.BasePermission):
    """Authenticated user with manager StaffProfile."""
    message = 'Manager access required.'

    def has_permission(self, request, view):
        _require_authenticated(request)
        profile = get_staff_profile(request.user)
        return profile is not None and profile.is_manager


class IsKitchenStaff(permissions.BasePermission):
    """Authenticated user with kitchen StaffProfile (includes managers)."""
    message = 'Kitchen staff access required.'

    def has_permission(self, request, view):
        _require_authenticated(request)
        profile = get_staff_profile(request.user)
        return profile is not None and profile.is_kitchen_staff


class IsManagerOrReadOnly(permissions.BasePermission):
    """Public read access; write access restricted to managers.

    Returns 401 for unauthenticated write attempts, 403 for authenticated
    non-manager write attempts.
    """

    message = 'Manager access required for modifications.'

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        _require_authenticated(request)
        profile = get_staff_profile(request.user)
        return profile is not None and profile.is_manager


class IsPublicOrderWrite(permissions.BasePermission):
    """Allow unauthenticated order creation (public customer ordering).
    Read/list access is restricted to staff.

    Returns 401 for unauthenticated read attempts, 403 for authenticated
    non-staff read attempts.
    """

    message = 'Staff access required.'

    def has_permission(self, request, view):
        if request.method == 'POST':
            return True
        _require_authenticated(request)
        return get_staff_profile(request.user) is not None
