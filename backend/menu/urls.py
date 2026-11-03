from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, MenuItemViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'categories', CategoryViewSet)
router.register(r'items', MenuItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
