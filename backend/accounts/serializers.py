from rest_framework import serializers
from django.contrib.auth.models import User


class StaffLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})


class StaffUserSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    role = serializers.CharField(read_only=True)
    is_manager = serializers.BooleanField(read_only=True)
