from django.db import models
from django.contrib.auth.models import User


class StaffProfile(models.Model):
    """Links a Django User to a staff role for the BhojanQR admin/kitchen portals."""

    ROLE_MANAGER = 'manager'
    ROLE_KITCHEN = 'kitchen'

    ROLE_CHOICES = [
        (ROLE_MANAGER, 'Manager'),
        (ROLE_KITCHEN, 'Kitchen Staff'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='staff_profile',
        help_text='Django user account granted staff portal access.',
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_KITCHEN,
        help_text='manager = full admin access; kitchen = view orders & update prep status.',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"

    @property
    def is_manager(self):
        return self.role == self.ROLE_MANAGER

    @property
    def is_kitchen_staff(self):
        return self.role in (self.ROLE_MANAGER, self.ROLE_KITCHEN)


def get_staff_profile(user):
    """Safely return the StaffProfile for an authenticated user, or None."""
    if not user or not user.is_authenticated:
        return None
    try:
        return user.staff_profile
    except StaffProfile.DoesNotExist:
        return None
