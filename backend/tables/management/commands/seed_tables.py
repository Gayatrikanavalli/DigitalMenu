import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand

from tables.models import RestaurantTable


class Command(BaseCommand):
    help = "Idempotently seed restaurant tables from initial_seed.json."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fixture",
            default="initial_seed.json",
            help="Fixture filename relative to BASE_DIR.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without modifying the database.",
        )

    def handle(self, *args, **options):
        fixture_path = os.path.join(settings.BASE_DIR, options["fixture"])

        with open(fixture_path, encoding="utf-8") as fixture_file:
            data = json.load(fixture_file)

        table_entries = [
            entry for entry in data if entry.get("model") == "tables.restauranttable"
        ]

        to_create = []
        to_skip = []

        for entry in table_entries:
            slug = entry["fields"]["table_number"]
            if RestaurantTable.objects.filter(table_number=slug).exists():
                to_skip.append(slug)
            else:
                to_create.append(entry)

        self.stdout.write("Table preview:")
        self.stdout.write(f"  To create: {len(to_create)}")
        self.stdout.write(f"  To skip:   {len(to_skip)}")

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run only; no changes made."))
            return

        created = 0
        for entry in table_entries:
            fields = entry["fields"]
            table_number = fields["table_number"]

            _, was_created = RestaurantTable.objects.get_or_create(
                table_number=table_number,
                defaults={
                    "display_name": fields["display_name"],
                    "capacity": fields.get("capacity", 4),
                    "section": fields.get("section", "Ground Floor"),
                    "is_active": fields.get("is_active", True),
                },
            )

            if was_created:
                created += 1
                self.stdout.write(self.style.SUCCESS(f"Created table '{table_number}'"))
            else:
                self.stdout.write(f"Table '{table_number}' already exists; skipped")

        self.stdout.write(
            self.style.SUCCESS(f"Seeding complete. Created {created} new table(s).")
        )
