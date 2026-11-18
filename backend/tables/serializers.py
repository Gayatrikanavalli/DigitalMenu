import re

from rest_framework import serializers
from .models import RestaurantTable


def _normalize_table_number(value):
    # Prevent future duplicates caused by spaces or different letter casing.
    # Strip, uppercase, and remove all whitespace for a canonical form.
    return re.sub(r'\s+', '', (value or '').strip()).upper()


class RestaurantTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantTable
        fields = [
            'id', 'table_number', 'display_name', 'capacity',
            'section', 'qr_code_image', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_code_image', 'created_at', 'updated_at']

    def validate_table_number(self, value):
        normalized = _normalize_table_number(value)
        if not normalized:
            raise serializers.ValidationError('Table number is required.')

        qs = RestaurantTable.objects.all()
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        # Compare against normalized form of existing records to catch spaced/cased variants
        for existing in qs.only('id', 'table_number'):
            if _normalize_table_number(existing.table_number) == normalized:
                raise serializers.ValidationError(f'Table "{normalized}" already exists.')

        # Return original trimmed/cased text as entered (uppercased) for consistent storage,
        # but uniqueness is enforced on the normalized (space-insensitive) form above.
        return (value or '').strip().upper()

    def validate_capacity(self, value):
        if value is None or int(value) < 1:
            raise serializers.ValidationError('Capacity must be at least 1.')
        return value
