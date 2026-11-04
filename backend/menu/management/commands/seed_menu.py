import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand

from menu.models import Category, MenuItem


class Command(BaseCommand):
    help = "Idempotently seed menu categories and items from a fixture."

    def add_arguments(self, parser):
        parser.add_argument(
            "--fixture",
            default="menu_seed.json",
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

        category_entries = [
            entry for entry in data if entry.get("model") == "menu.category"
        ]
        item_entries = [
            entry for entry in data if entry.get("model") == "menu.menuitem"
        ]

        category_slug_by_pk = {
            entry["pk"]: entry["fields"]["slug"] for entry in category_entries
        }

        existing_category_slugs = set(
            Category.objects.values_list("slug", flat=True)
        )
        existing_item_slugs = set(MenuItem.objects.values_list("slug", flat=True))

        categories_to_create = []
        categories_to_skip = []

        for entry in category_entries:
            slug = entry["fields"]["slug"]
            if slug in existing_category_slugs:
                categories_to_skip.append(slug)
            else:
                categories_to_create.append(entry)

        available_category_slugs = existing_category_slugs | {
            entry["fields"]["slug"] for entry in categories_to_create
        }

        items_to_create = []
        items_to_skip = []
        items_without_category = []

        for entry in item_entries:
            fields = entry["fields"]
            slug = fields["slug"]

            if slug in existing_item_slugs:
                items_to_skip.append(slug)
                continue

            category_slug = category_slug_by_pk.get(fields["category"])
            if category_slug not in available_category_slugs:
                items_without_category.append(slug)
                continue

            items_to_create.append(entry)

        self.stdout.write("Category preview:")
        self.stdout.write(f"  To create: {len(categories_to_create)}")
        self.stdout.write(f"  To skip:   {len(categories_to_skip)}")

        self.stdout.write("Menu item preview:")
        self.stdout.write(f"  To create: {len(items_to_create)}")
        self.stdout.write(f"  To skip:   {len(items_to_skip)}")
        if items_without_category:
            self.stdout.write(
                self.style.WARNING(
                    "  Skipped because category is unavailable: "
                    + ", ".join(items_without_category)
                )
            )

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING("Dry run only; no changes made."))
            return

        category_map = {}

        for entry in category_entries:
            fields = entry["fields"]
            slug = fields["slug"]

            category, created = Category.objects.get_or_create(
                slug=slug,
                defaults={
                    "name": fields["name"],
                    "icon": fields.get("icon", "UtensilsCrossed"),
                    "order": fields.get("order", 0),
                },
            )

            category_map[entry["pk"]] = category

        created_items = 0

        for entry in item_entries:
            fields = entry["fields"]
            slug = fields["slug"]

            if slug in existing_item_slugs:
                continue

            category = category_map.get(fields["category"])
            if category is None:
                category = Category.objects.filter(
                    slug=category_slug_by_pk.get(fields["category"])
                ).first()

            if category is None:
                self.stdout.write(
                    self.style.WARNING(f"Skipping '{slug}': category not found")
                )
                continue

            MenuItem.objects.create(
                category=category,
                name=fields["name"],
                slug=slug,
                description=fields.get("description", ""),
                price=fields["price"],
                image_url=fields.get("image_url", ""),
                food_type=fields.get("food_type", "veg"),
                is_available=fields.get("is_available", True),
                is_active=fields.get("is_active", True),
                is_deleted=fields.get("is_deleted", False),
                is_special=fields.get("is_special", False),
                is_popular=fields.get("is_popular", False),
                tags=fields.get("tags", []),
                spiciness=fields.get("spiciness", "medium"),
                preparation_time_mins=fields.get("preparation_time_mins", 15),
            )

            created_items += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeding complete. Created {created_items} new menu item(s)."
            )
        )
