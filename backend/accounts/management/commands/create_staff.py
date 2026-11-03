import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from accounts.models import StaffProfile


class Command(BaseCommand):
    help = 'Create staff accounts (manager + kitchen) from environment variables.'

    def handle(self, *args, **options):
        # Ensure Django groups exist.
        manager_group, _ = Group.objects.get_or_create(name='Manager')
        kitchen_group, _ = Group.objects.get_or_create(name='Kitchen Staff')

        staff_specs = [
            {
                'username': 'manager',
                'password': os.getenv('STAFF_MANAGER_PASSWORD', ''),
                'role': StaffProfile.ROLE_MANAGER,
                'group': manager_group,
            },
            {
                'username': 'kitchen',
                'password': os.getenv('STAFF_KITCHEN_PASSWORD', ''),
                'role': StaffProfile.ROLE_KITCHEN,
                'group': kitchen_group,
            },
        ]

        created = 0
        for spec in staff_specs:
            password = spec.pop('password')
            role = spec.pop('role')
            group = spec.pop('group')
            username = spec['username']

            if not password:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping '{username}': password env var not set."
                    )
                )
                continue

            user, user_created = User.objects.get_or_create(username=username)
            if user_created:
                user.set_password(password)
                user.is_staff = True
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Created user '{username}'"))
            else:
                user.set_password(password)
                user.is_staff = True
                user.save()

            profile, profile_created = StaffProfile.objects.get_or_create(
                user=user,
                defaults={'role': role},
            )
            if not profile_created and profile.role != role:
                profile.role = role
                profile.save()

            # Assign to the correct Django group (and remove from the other).
            other_group = kitchen_group if group == manager_group else manager_group
            user.groups.remove(other_group)
            user.groups.add(group)

            if user_created or profile_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f'Created {created} staff account(s).'))
