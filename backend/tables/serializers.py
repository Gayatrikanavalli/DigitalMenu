from rest_framework import serializers
from .models import RestaurantTable

class RestaurantTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantTable
        fields = [
            'id', 'table_number', 'display_name', 'capacity',
            'section', 'qr_code_image', 'is_active', 'created_at', 'updated_at'
        ]
