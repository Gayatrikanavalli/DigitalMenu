import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from tables.models import RestaurantTable
from tables.views import TableViewSet

for num in ['T-05', 'T-06']:
    if not RestaurantTable.objects.filter(table_number=num).exists():
        cap = 4 if num == 'T-05' else 2
        sec = 'VIP Lounge' if num == 'T-05' else 'Mezzanine'
        t = RestaurantTable.objects.create(
            table_number=num,
            display_name=f'Table {num.split("-")[1]}',
            capacity=cap,
            section=sec,
            is_active=True
        )
        print(f'Created {num}')
    else:
        print(f'{num} already exists')

vs = TableViewSet()
for t in RestaurantTable.objects.filter(is_active=True).order_by('table_number'):
    vs._generate_table_qr(t)
    print(f'Regenerated QR for {t.table_number} -> {t.qr_code_image.name}')
