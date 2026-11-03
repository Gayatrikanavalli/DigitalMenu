from rest_framework import viewsets, filters, permissions, status
from rest_framework.response import Response
from .models import Category, MenuItem
from .serializers import CategorySerializer, MenuItemSerializer
from accounts.permissions import IsManagerOrReadOnly
from accounts.models import get_staff_profile
from django.db.models import Sum, Value
from django.db.models.functions import Coalesce

try:
    from django_filters.rest_framework import DjangoFilterBackend
    HAS_DJANGO_FILTERS = True
except ImportError:
    HAS_DJANGO_FILTERS = False

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsManagerOrReadOnly]

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsManagerOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter] + ([DjangoFilterBackend] if HAS_DJANGO_FILTERS else [])
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['price', 'created_at', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(order_count=Coalesce(Sum('orderitem__quantity'), Value(0)))
        category_slug = self.request.query_params.get('category')
        if category_slug and category_slug != 'all':
            queryset = queryset.filter(category__slug=category_slug)
        food_type = self.request.query_params.get('food_type')
        if food_type in ['veg', 'non-veg']:
            queryset = queryset.filter(food_type=food_type)
        include_inactive = self.request.query_params.get('include_inactive') == 'true'
        is_staff = get_staff_profile(self.request.user) is not None
        queryset = queryset.filter(is_deleted=False)
        if not (include_inactive or is_staff):
            queryset = queryset.filter(is_active=True, is_available=True)
        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.is_active = False
        instance.is_available = False
        instance.save(update_fields=['is_deleted', 'is_active', 'is_available', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)