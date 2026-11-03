from django.db import models
from menu.models import MenuItem
from tables.models import RestaurantTable
from decimal import Decimal

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    order_number = models.CharField(max_length=50, unique=True)
    table = models.ForeignKey(RestaurantTable, on_delete=models.PROTECT, related_name='orders')
    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=25, blank=True)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    estimated_minutes = models.PositiveIntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.order_number} - Table {self.table.table_number}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Server-locked price at time of order
    quantity = models.PositiveIntegerField(default=1)
    food_type = models.CharField(max_length=10, default='veg')
    special_notes = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.quantity}x {self.name} (Order #{self.order.order_number})"
