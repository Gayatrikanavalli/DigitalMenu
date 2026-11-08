from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
import uuid
from .models import Order, OrderItem
from menu.models import MenuItem
from tables.models import RestaurantTable


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'name', 'price', 'quantity', 'food_type', 'special_notes']
        read_only_fields = ['name', 'price', 'food_type']


class OrderCreateItemInputSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    special_notes = serializers.CharField(required=False, allow_blank=True, default='')


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)
    table_identifier = serializers.CharField(write_only=True, required=False)
    order_items_input = OrderCreateItemInputSerializer(many=True, write_only=True, required=False)
    customer_phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'table_identifier',
            'customer_name', 'customer_phone', 'special_instructions',
            'status', 'subtotal', 'tax', 'total', 'estimated_minutes',
            'created_at', 'updated_at', 'items', 'order_items_input'
        ]
        read_only_fields = ['order_number', 'subtotal', 'tax', 'total', 'status']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if not (request and getattr(request, 'user', None) and request.user.is_authenticated):
            data['customer_phone'] = ''
        return data

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the table FK optional at validation time; we resolve it from
        # table_identifier inside create() before the model is saved.
        self.fields['table'].required = False
        self.fields['table'].allow_null = True

    def create(self, validated_data):
        table_identifier = validated_data.pop('table_identifier', None)
        items_input = validated_data.pop('order_items_input', [])

        if not items_input:
            raise serializers.ValidationError({'order_items_input': 'At least one menu item is required.'})

        # Resolve table FK from table_identifier string if not already set
        table = validated_data.get('table')
        if not table:
            if not table_identifier:
                raise serializers.ValidationError(
                    {'table_identifier': 'Either table (FK) or table_identifier (e.g. "T-01") is required.'}
                )
            try:
                table = RestaurantTable.objects.get(table_number__iexact=table_identifier)
            except RestaurantTable.DoesNotExist:
                raise serializers.ValidationError(
                    {'table_identifier': f'No table found with number "{table_identifier}".'}
                )
            validated_data['table'] = table

        with transaction.atomic():
            # Generate unique order number
            order_number = f"BHOJAN-{uuid.uuid4().hex[:5].upper()}"
            order = Order.objects.create(order_number=order_number, **validated_data)

            # Trusted price calculation from database
            subtotal = Decimal('0.00')
            order_items_to_create = []

            for item_data in items_input:
                try:
                    menu_item = MenuItem.objects.get(id=item_data['menu_item_id'])
                except MenuItem.DoesNotExist:
                    raise serializers.ValidationError(
                        {'order_items_input': f"Menu item {item_data['menu_item_id']} was not found."}
                    )
                if menu_item.is_deleted or not menu_item.is_active or not menu_item.is_available:
                    raise serializers.ValidationError(f"Item '{menu_item.name}' is currently unavailable.")

                qty = item_data['quantity']
                line_total = menu_item.price * qty
                subtotal += line_total

                order_items_to_create.append(
                    OrderItem(
                        order=order,
                        menu_item=menu_item,
                        name=menu_item.name,
                        price=menu_item.price,  # Authoritative price from DB
                        quantity=qty,
                        food_type=menu_item.food_type,
                        special_notes=item_data.get('special_notes', '')
                    )
                )

            OrderItem.objects.bulk_create(order_items_to_create)

            # 5% Restaurant GST
            tax = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))
            total = subtotal + tax

            order.subtotal = subtotal
            order.tax = tax
            order.total = total
            order.save()

        return order
