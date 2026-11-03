from django.urls import path

from .views import LoginView, LogoutView, MeView

urlpatterns = [
    path('auth/login', LoginView.as_view(), name='staff-login'),
    path('auth/logout', LogoutView.as_view(), name='staff-logout'),
    path('auth/me', MeView.as_view(), name='staff-me'),
]
