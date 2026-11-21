import os

from django.contrib.auth.models import Group, User
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import StaffProfile


class Command(BaseCommand):
    help = (
        "One-time, env-gated manager bootstrap/reset. No-op unless "
        "MANAGER_BOOTSTRAP_ENABLED=true. Never logs credentials."
    )

    def handle(self, *args, **options):
        enabled = os.getenv("MANAGER_BOOTSTRAP_ENABLED", "").strip().lower() == "true"
        if not enabled:
            self.stdout.write("Manager bootstrap: skipped (disabled).")
            return

        username = os.getenv("MANAGER_BOOTSTRAP_USERNAME", "").strip()
        password = os.getenv("MANAGER_BOOTSTRAP_PASSWORD", "").strip()
        email = os.getenv("MANAGER_BOOTSTRAP_EMAIL", "").strip()

        # Validate without exposing secret values.
        if not username or not password:
            raise CommandError(
                "Manager bootstrap: invalid configuration (MANAGER_BOOTSTRAP_USERNAME and MANAGER_BOOTSTRAP_PASSWORD are required)."
            )

        if len(password) < 12:
            raise CommandError(
                "Manager bootstrap: invalid configuration (MANAGER_BOOTSTRAP_PASSWORD must be at least 12 characters)."
            )

        try:
            with transaction.atomic():
                user, _ = User.objects.get_or_create(
                    username=username,
                    defaults={"is_staff": True, "is_active": True},
                )
                user.is_staff = True
                user.is_active = True
                if email:
                    user.email = email
                user.set_password(password)
                user.save()

                StaffProfile.objects.update_or_create(
                    user=user,
                    defaults={"role": StaffProfile.ROLE_MANAGER},
                )

                # Keep Django groups consistent with existing staff role pattern.
                manager_group, _ = Group.objects.get_or_create(name="Manager")
                kitchen_group, _ = Group.objects.get_or_create(name="Kitchen Staff")
                user.groups.remove(kitchen_group)
                user.groups.add(manager_group)

            # Safe verification (no secrets/password/hash logged)
            username_ok = username == "manager"
            self.stdout.write(f"Bootstrap check - username is manager: {'PASS' if username_ok else 'FAIL'}")

            mgr = User.objects.filter(username="manager").first()
            exists_active = bool(mgr and mgr.is_active)
            self.stdout.write(f"Bootstrap check - manager exists and active: {'PASS' if exists_active else 'FAIL'}")

            pwd_ok = bool(mgr and mgr.check_password(password))
            self.stdout.write(f"Bootstrap check - password matches: {'PASS' if pwd_ok else 'FAIL'}")

            role_ok = bool(mgr and hasattr(mgr, "staff_profile") and mgr.staff_profile.role == StaffProfile.ROLE_MANAGER)
            self.stdout.write(f"Bootstrap check - staff profile role manager: {'PASS' if role_ok else 'FAIL'}")

            # Non-sensitive confirmation only.
            self.stdout.write(self.style.SUCCESS("Manager bootstrap: completed."))
        except Exception as exc:
            # Do not leak credentials or sensitive exception details.
            raise CommandError(f"Manager bootstrap: failed ({exc.__class__.__name__}).") from None
