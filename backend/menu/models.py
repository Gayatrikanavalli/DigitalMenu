from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, default='UtensilsCrossed')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

class MenuItem(models.Model):
    FOOD_TYPE_CHOICES = (
        ('veg', 'Vegetarian'),
        ('non-veg', 'Non-Vegetarian'),
    )

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    image_url = models.URLField(max_length=500, blank=True)
    image = models.ImageField(upload_to='dishes/', blank=True, null=True)
    food_type = models.CharField(max_length=10, choices=FOOD_TYPE_CHOICES, default='veg')
    is_available = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    is_special = models.BooleanField(default=False)
    is_popular = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)
    spiciness = models.CharField(max_length=10, choices=(('mild', 'Mild'), ('medium', 'Medium'), ('spicy', 'Spicy')), default='medium')
    preparation_time_mins = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_special', '-is_popular', 'name']

    def __str__(self):
        return f"{self.name} (₹{self.price})"
