from rest_framework import serializers
from .models import Category, MenuItem

class CategorySerializer(serializers.ModelSerializer):
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'order', 'items_count']

class MenuItemSerializer(serializers.ModelSerializer):
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_slug', 'category_name', 'name', 'slug',
            'description', 'price', 'image_url', 'image', 'food_type',
            'is_active', 'is_deleted', 'is_available', 'is_special', 'is_popular', 'tags', 'spiciness',
            'preparation_time_mins', 'created_at', 'updated_at', 'order_count'
        ]
