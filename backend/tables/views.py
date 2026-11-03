from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from django.core.files.base import ContentFile
import qrcode
import io
import os
from .models import RestaurantTable
from .serializers import RestaurantTableSerializer
from accounts.permissions import IsManagerOrReadOnly


def _get_frontend_url():
    """Return the public frontend URL used in table QR codes.
    Uses the FRONTEND_PUBLIC_URL environment variable (then the Django setting).
    Inside Docker, LAN IP auto-detection returns the container IP (unreachable
    from phones), so the operator must set FRONTEND_PUBLIC_URL to the laptop's
    LAN IP (e.g. http://192.168.1.5:3000) for QR codes to work from mobile devices."""
    base = os.environ.get('FRONTEND_PUBLIC_URL') or getattr(settings, 'FRONTEND_PUBLIC_URL', 'http://localhost:3000')
    return base


class TableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.filter(is_active=True)
    serializer_class = RestaurantTableSerializer
    permission_classes = [IsManagerOrReadOnly]

    def perform_create(self, serializer):
        table = serializer.save()
        self._generate_table_qr(table)

    def _generate_table_qr(self, table):
        """Generates and saves QR code using Python qrcode library."""
        frontend_url = _get_frontend_url()
        qr_target_url = f"{frontend_url}/?table={table.table_number}"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_target_url)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#78350F", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')

        file_name = f"qr_table_{table.table_number.lower().replace('-', '_')}.png"
        table.qr_code_image.save(file_name, ContentFile(buffer.getvalue()), save=True)

    @action(detail=True, methods=['post', 'get'])
    def generate_qr(self, request, pk=None):
        table = self.get_object()
        self._generate_table_qr(table)
        frontend_url = _get_frontend_url()
        qr_target_url = f"{frontend_url}/?table={table.table_number}"
        return Response({
            "table_number": table.table_number,
            "qr_target_url": qr_target_url,
            "qr_code_image": request.build_absolute_uri(table.qr_code_image.url) if table.qr_code_image else None
        }, status=status.HTTP_200_OK)
