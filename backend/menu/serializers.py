from rest_framework import serializers
from django.utils import timezone
from .models import Category, MenuItem

class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'order', 'items_count']

    def get_items_count(self, obj):
        # Count all non-deleted dishes belonging to this category (actual DB assignment),
        # regardless of active/available state, so admin counts and delete-safety are consistent.
        if hasattr(obj, '_items_count'):
            return obj._items_count
        return obj.items.filter(is_deleted=False).count()

class MenuItemSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    order_count = serializers.IntegerField(read_only=True)
    is_offer_active = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_slug', 'category_name', 'name', 'slug',
            'description', 'price', 'image_url', 'image', 'food_type',
            'is_active', 'is_deleted', 'is_available', 'is_special', 'is_popular', 'tags', 'spiciness',
            'preparation_time_mins', 'discount_percentage', 'offer_active', 'offer_start_date', 'offer_end_date',
            'is_offer_active', 'created_at', 'updated_at', 'order_count'
        ]

    def get_is_offer_active(self, obj):
        try:
            if not obj.offer_active:
                return False
            if not obj.discount_percentage or int(obj.discount_percentage) <= 0:
                return False
            if obj.is_deleted or not obj.is_active or not obj.is_available:
                return False
            today = timezone.localdate()
            if obj.offer_start_date and today < obj.offer_start_date:
                return False
            if obj.offer_end_date and today > obj.offer_end_date:
                return False
            return True
        except Exception:
            return False

    def validate(self, attrs):
        name = attrs.get('name', getattr(self.instance, 'name', None))
        category = attrs.get('category', getattr(self.instance, 'category', None))

        if name and category is not None:
            queryset = MenuItem.objects.filter(name__iexact=name, category=category, is_deleted=False)
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)
            if queryset.exists():
                raise serializers.ValidationError(
                    {'name': 'A menu item with this name already exists in the selected category.'}
                )

        discount = attrs.get('discount_percentage', getattr(self.instance, 'discount_percentage', 0) if self.instance else 0)
        if discount is None:
            discount = 0
        if discount < 0 or discount > 99:
            raise serializers.ValidationError({'discount_percentage': 'Discount percentage must be between 0 and 99.'})

        start = attrs.get('offer_start_date', getattr(self.instance, 'offer_start_date', None) if self.instance else None)
        end = attrs.get('offer_end_date', getattr(self.instance, 'offer_end_date', None) if self.instance else None)
        # allow clearing via explicit null in partial updates
        if 'offer_start_date' in attrs:
            start = attrs.get('offer_start_date')
        if 'offer_end_date' in attrs:
            end = attrs.get('offer_end_date')
        if start and end and end < start:
            raise serializers.ValidationError({'offer_end_date': 'Offer end date cannot be before start date.'})

        return attrs
