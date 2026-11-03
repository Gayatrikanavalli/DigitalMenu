import React, { useState } from 'react';
import { X, Code2, Copy, Check, Server, Database, Container, FileText } from 'lucide-react';

interface DjangoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DjangoCodeModal: React.FC<DjangoCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'serializers' | 'views' | 'urls' | 'migrations' | 'axios' | 'docker' | 'readme'>('models');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const codeSnippets = {
    models: `# backend/menu/models.py & backend/orders/models.py
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
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    image = models.ImageField(upload_to='dishes/', blank=True, null=True)
    image_url = models.URLField(max_length=500, blank=True)
    food_type = models.CharField(max_length=10, choices=FOOD_TYPE_CHOICES, default='veg')
    is_available = models.BooleanField(default=True)
    is_special = models.BooleanField(default=False)
    preparation_time_mins = models.PositiveIntegerField(default=15)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (₹{self.price})"

class RestaurantTable(models.Model):
    SECTION_CHOICES = (
        ('Ground Floor', 'Ground Floor'),
        ('Outdoor Terrace', 'Outdoor Terrace'),
        ('Mezzanine', 'Mezzanine'),
        ('VIP Lounge', 'VIP Lounge'),
    )
    table_number = models.CharField(max_length=20, unique=True)
    display_name = models.CharField(max_length=100)
    capacity = models.PositiveIntegerField(default=4)
    section = models.CharField(max_length=50, choices=SECTION_CHOICES, default='Ground Floor')
    qr_code_image = models.ImageField(upload_to='qrcodes/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Table {self.table_number} ({self.display_name})"

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    order_number = models.CharField(max_length=30, unique=True)
    table = models.ForeignKey(RestaurantTable, on_delete=models.PROTECT, related_name='orders')
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20, blank=True)
    special_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.PROTECT)
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2) # Server-locked master price
    quantity = models.PositiveIntegerField(default=1)
    food_type = models.CharField(max_length=10)
    special_notes = models.CharField(max_length=255, blank=True)
`,
    serializers: `# backend/orders/serializers.py & backend/menu/serializers.py
from rest_framework import serializers
from decimal import Decimal
from .models import Category, MenuItem, RestaurantTable, Order, OrderItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    class Meta:
        model = MenuItem
        fields = '__all__'

class RestaurantTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestaurantTable
        fields = '__all__'

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'name', 'price', 'quantity', 'food_type', 'special_notes']
        read_only_fields = ['price', 'name', 'food_type']

class OrderCreateItemSerializer(serializers.Serializer):
    menu_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    special_notes = serializers.CharField(required=False, allow_blank=True)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    table_number = serializers.CharField(source='table.table_number', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'table', 'table_number', 'customer_name',
            'customer_phone', 'special_instructions', 'status',
            'subtotal', 'tax', 'total', 'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['order_number', 'subtotal', 'tax', 'total', 'status']

    def create(self, validated_data):
        # Backend-enforced price verification from PostgreSQL
        items_data = self.context.get('request').data.get('items', [])
        subtotal = Decimal('0.00')
        order_items = []

        import uuid
        order_number = f"BHOJAN-{uuid.uuid4().hex[:6].upper()}"
        order = Order.objects.create(order_number=order_number, **validated_data)

        for it in items_data:
            menu_item = MenuItem.objects.get(id=it['menu_item_id'], is_available=True)
            qty = int(it.get('quantity', 1))
            line_cost = menu_item.price * qty
            subtotal += line_cost
            order_items.append(OrderItem(
                order=order,
                menu_item=menu_item,
                name=menu_item.name,
                price=menu_item.price, # Trusted price from DB!
                quantity=qty,
                food_type=menu_item.food_type,
                special_notes=it.get('special_notes', '')
            ))

        OrderItem.objects.bulk_create(order_items)
        tax = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))
        order.subtotal = subtotal
        order.tax = tax
        order.total = subtotal + tax
        order.save()
        return order
`,
    views: `# backend/orders/views.py & tables/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
import qrcode
import io
from django.core.files.base import ContentFile
from .models import Order, RestaurantTable, MenuItem, Category
from .serializers import OrderSerializer, RestaurantTableSerializer, MenuItemSerializer, CategorySerializer

class TableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.filter(is_active=True)
    serializer_class = RestaurantTableSerializer

    @action(detail=True, methods=['get'])
    def generate_qr(self, request, pk=None):
        table = self.get_object()
        frontend_public_url = getattr(settings, 'FRONTEND_PUBLIC_URL', 'http://localhost:3000')
        qr_url = f"{frontend_public_url}/?table={table.table_number}"

        # Generate QR code using Python qrcode library
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#78350F", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        filename = f"qr_table_{table.table_number}.png"
        table.qr_code_image.save(filename, ContentFile(buffer.getvalue()), save=True)

        return Response({
            "table_number": table.table_number,
            "qr_url": qr_url,
            "image_url": request.build_absolute_uri(table.qr_code_image.url)
        })

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        return Response(self.get_serializer(order).data)
`,
    urls: `# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from menu.views import CategoryViewSet, MenuItemViewSet
from tables.views import TableViewSet
from orders.views import OrderViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'menu-items', MenuItemViewSet)
router.register(r'tables', TableViewSet)
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
`,
    migrations: `# Django 5.0 PostgreSQL Migrations
# 1. backend/menu/migrations/0001_initial.py
# 2. backend/tables/migrations/0001_initial.py
# 3. backend/orders/migrations/0001_initial.py

# Run migrations against PostgreSQL:
# $ python manage.py migrate

class Migration(migrations.Migration):
    initial = True
    dependencies = [('menu', '0001_initial'), ('tables', '0001_initial')]
    operations = [
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(primary_key=True)),
                ('order_number', models.CharField(max_length=50, unique=True)),
                ('customer_name', models.CharField(max_length=120)),
                ('status', models.CharField(default='pending', max_length=20)),
                ('subtotal', models.DecimalField(max_digits=10, decimal_places=2)),
                ('tax', models.DecimalField(max_digits=10, decimal_places=2)),
                ('total', models.DecimalField(max_digits=10, decimal_places=2)),
                ('table', models.ForeignKey(to='tables.restauranttable', on_delete=models.PROTECT)),
            ],
        ),
    ]
`,
    axios: `// src/lib/axios.ts & frontend/lib/axios.ts
import axios, { AxiosInstance } from 'axios';

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Example real order creation via Axios:
export const submitOrder = async (orderPayload) => {
  const { data } = await apiClient.post('/orders/', {
    table_identifier: orderPayload.tableNumber,
    customer_name: orderPayload.customerName,
    order_items_input: orderPayload.items,
  });
  return data;
};
`,
    docker: `# docker-compose.yml for BhojanQR
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: bhojanqr_postgres
    restart: always
    environment:
      POSTGRES_DB: bhojan_db
      POSTGRES_USER: bhojan_user
      POSTGRES_PASSWORD: bhojan_secure_password_2026
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: bhojanqr_django
    restart: always
    command: >
      sh -c "python manage.py migrate &&
             python manage.py loaddata initial_dishes.json &&
             python manage.py runserver 0.0.0.0:8000"
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DB_NAME=bhojan_db
      - DB_USER=bhojan_user
      - DB_PASSWORD=bhojan_secure_password_2026
      - DB_HOST=db
      - DB_PORT=5432
      - FRONTEND_PUBLIC_URL=http://192.168.1.5:3000
    depends_on:
      - db

  frontend:
    build: ./frontend
    container_name: bhojanqr_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000/api
    depends_on:
      - backend

volumes:
  postgres_data:
`,
    readme: `# BhojanQR – Restaurant Digital Menu & QR Order System
Internship Assessment Project for Atronz Innovations

## Architecture Overview
- Frontend: Next.js 14 / React 19, Tailwind CSS, Axios, Lucide Icons
- Backend: Python 3.10+, Django 5.0, Django REST Framework, Python qrcode library
- Database: PostgreSQL 15 with ACID compliance & decimal currency precision
- Table QR Workflow: Auto table detection (?table=T-01), verified line calculation

## Quick Start
1. Run docker containers:
   $ docker compose up --build
2. Access applications:
   - Customer Digital Menu: http://192.168.1.5:3000
   - Kitchen Display Screen: http://192.168.1.5:3000 (Switch to Kitchen)
   - Django Admin: http://192.168.1.5:8000/admin (user: admin / pass: admin123)
   - DRF Browsable API: http://192.168.1.5:8000/api/
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-950 text-stone-100 rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-stone-800 relative my-8 flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-white">
              BhojanQR Full-Stack Architecture Specification
            </h2>
            <p className="text-xs text-stone-400">
              Django 5 · Django REST Framework · PostgreSQL 15 · Python qrcode · Docker
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-4 gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'models', label: 'Django Models', icon: Database },
              { id: 'serializers', label: 'DRF Serializers', icon: Server },
              { id: 'views', label: 'Views & QR Generator', icon: Code2 },
              { id: 'urls', label: 'URL Routing', icon: FileText },
              { id: 'migrations', label: 'PostgreSQL Migrations', icon: Database },
              { id: 'axios', label: 'Axios & Next.js Client', icon: Code2 },
              { id: 'docker', label: 'Docker Compose', icon: Container },
              { id: 'readme', label: 'Setup Guide', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content View */}
        <div className="flex-1 overflow-y-auto bg-stone-900 rounded-xl p-4 border border-stone-800 text-xs font-mono text-stone-300 leading-relaxed">
          <pre>{codeSnippets[activeTab]}</pre>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>All backend files are also generated in the project <code className="text-amber-400 font-mono">/backend/</code> and <code className="text-amber-400 font-mono">docker-compose.yml</code> root.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
