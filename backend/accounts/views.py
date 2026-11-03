from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import get_staff_profile
from .permissions import IsStaff, IsManager, IsKitchenStaff
from .serializers import StaffLoginSerializer, StaffUserSerializer


class LoginView(APIView):
    """Staff login. Creates a Django session (session cookie) for the browser."""

    permission_classes = [permissions.AllowAny]
    serializer_class = StaffLoginSerializer

    def post(self, request):
        serializer = StaffLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
        )
        if user is None:
            return Response(
                {'error': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        profile = get_staff_profile(user)
        if profile is None:
            return Response(
                {'error': 'This account is not configured for staff portal access.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)
        return Response(
            {
                'user': StaffUserSerializer(
                    {
                        'username': user.username,
                        'role': profile.role,
                        'is_manager': profile.is_manager,
                    }
                ).data,
                'is_authenticated': True,
            }
        )


class LogoutView(APIView):
    """Staff logout. Clears the Django session."""

    permission_classes = [IsStaff]

    def post(self, request):
        logout(request)
        return Response({'success': True})


class MeView(APIView):
    """Return the current authenticated staff user, if any."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        get_token(request)
        if not request.user.is_authenticated:
            return Response(
                {'is_authenticated': False},
                status=status.HTTP_200_OK,
            )
        profile = get_staff_profile(request.user)
        if profile is None:
            # Authenticated but not a staff member (e.g. a plain customer). Treat
            # as unauthenticated for staff-portal purposes.
            return Response(
                {'is_authenticated': False},
                status=status.HTTP_200_OK,
            )
        return Response(
            {
                'is_authenticated': True,
                'user': StaffUserSerializer(
                    {
                        'username': request.user.username,
                        'role': profile.role,
                        'is_manager': profile.is_manager,
                    }
                ).data,
                'is_manager': profile.is_manager,
                'is_kitchen_staff': profile.is_kitchen_staff,
            }
        )
