from django.db import transaction
from django.db.models import ProtectedError
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer
from accounts.permissions import IsStaff, IsManager, IsKitchenStaff


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='create')
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().prefetch_related('items').order_by('-created_at')
    serializer_class = OrderSerializer

    def get_permissions(self):
        # Customers (unauthenticated) may create orders and look up a single order
        # for tracking. Listing all orders and mutating status is staff-only.
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action == 'cancel_order':
            return [IsManager()]
        if self.action == 'destroy':
            return [IsManager()]
        if self.action in ['update_status', 'kitchen_feed']:
            return [IsKitchenStaff()]
        if self.action == 'list':
            return [IsStaff()]
        # retrieve / track: public so customers can check their own order status.
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = super().get_queryset()
        # Staff listing can filter by table or status; customers only ever fetch
        # a single order via retrieve/track.
        table_number = self.request.query_params.get('table')
        if table_number:
            queryset = queryset.filter(table__table_number__iexact=table_number)
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=True, methods=['patch', 'put'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        allowed_statuses = [choice[0] for choice in Order.STATUS_CHOICES]

        if new_status not in allowed_statuses:
            return Response(
                {"error": f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = new_status
        order.save()
        return Response(self.get_serializer(order).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def kitchen_feed(self, request):
        """Dedicated kitchen display stream for active tickets."""
        active_orders = self.get_queryset().filter(status__in=['pending', 'preparing', 'ready'])
        serializer = self.get_serializer(active_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='track/(?P<order_number>[^/.]+)')
    def track(self, request, order_number=None):
        """Public order status lookup by order number (e.g. BHOJAN-ABCDE)."""
        try:
            order = Order.objects.prefetch_related('items').get(order_number__iexact=order_number)
        except Order.DoesNotExist:
            return Response(
                {'error': f'No order found with number "{order_number}".'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['patch', 'put'], url_path='cancel')
    def cancel_order(self, request, pk=None):
        """Cancel an order. Only pending orders can be cancelled."""
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'error': f'Only pending orders can be cancelled. Current status: {order.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = 'cancelled'
        order.save()
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        order = self.get_object()
        if order.status not in ('completed', 'served'):
            return Response(
                {'error': 'Only completed orders can be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Safely remove related order items first, then the order itself,
        # within a single transaction so other records are never affected.
        try:
            with transaction.atomic():
                order.items.all().delete()
                order.delete()
        except ProtectedError:
            return Response(
                {'error': 'This order cannot be deleted because it is referenced by other records.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
