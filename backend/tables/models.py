from django.db import models

class RestaurantTable(models.Model):
    SECTION_CHOICES = (
        ('Ground Floor', 'Ground Floor'),
        ('Outdoor Terrace', 'Outdoor Terrace'),
        ('Mezzanine', 'Mezzanine'),
        ('VIP Lounge', 'VIP Lounge'),
    )

    table_number = models.CharField(max_length=20, unique=True, help_text="e.g. T-01, T-02")
    display_name = models.CharField(max_length=100, help_text="e.g. Table 1 (Window Side)")
    capacity = models.PositiveIntegerField(default=4)
    section = models.CharField(max_length=50, choices=SECTION_CHOICES, default='Ground Floor')
    qr_code_image = models.ImageField(upload_to='qrcodes/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['table_number']

    def __str__(self):
        return f"Table {self.table_number} ({self.display_name})"
