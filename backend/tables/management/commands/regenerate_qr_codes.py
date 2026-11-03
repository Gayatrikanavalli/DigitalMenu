from django.core.management.base import BaseCommand

from tables.models import RestaurantTable
from tables.views import TableViewSet


class Command(BaseCommand):
    help = "Regenerate QR code images for all tables using FRONTEND_PUBLIC_URL."

    def handle(self, *args, **options):
        viewset = TableViewSet()
        tables = RestaurantTable.objects.all()
        count = 0
        for table in tables:
            viewset._generate_table_qr(table)
            count += 1
            self.stdout.write(f"Regenerated QR code for table {table.table_number}")
        self.stdout.write(self.style.SUCCESS(f"Regenerated {count} QR code(s)."))
