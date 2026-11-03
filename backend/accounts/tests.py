import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from accounts.models import StaffProfile
from tables.models import RestaurantTable
from menu.models import Category, MenuItem


class StaffAuthAndPermissionsTest(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=False)
        self.manager = User.objects.create_user('manager', 'm@x.com', 'manager123')
        StaffProfile.objects.create(user=self.manager, role=StaffProfile.ROLE_MANAGER)
        self.kitchen = User.objects.create_user('kitchen', 'k@x.com', 'kitchen123')
        StaffProfile.objects.create(user=self.kitchen, role=StaffProfile.ROLE_KITCHEN)
        RestaurantTable.objects.create(table_number='T-01', display_name='Table 1', capacity=4)
        Category.objects.create(id=1, name='Dum Biryani', slug='biryani', order=0)
        self.menu_item = MenuItem.objects.create(category_id=1, name='Test Biryani', slug='test-biryani',
            description='x', price=99, food_type='non-veg', is_available=True)

    def test_unauthenticated_staff_orders_rejected(self):
        r = self.client.get('/api/orders')
        self.assertEqual(r.status_code, 403)

    def test_unauthenticated_order_creation_allowed(self):
        r = self.client.post('/api/orders', data=json.dumps({
            "table_identifier": "T-01", "customer_name": "Guest",
            "customer_phone": "", "special_instructions": "",
            "order_items_input": [{"menu_item_id": self.menu_item.id, "quantity": 2}],
        }), content_type='application/json')
        # Permission is allowed; may be 400 only if seed menu item 1 missing, never 403.
        self.assertNotEqual(r.status_code, 403)

    def test_unauthenticated_track_404_for_missing(self):
        r = self.client.get('/api/orders/track/BHOJAN-XXXXX')
        self.assertEqual(r.status_code, 404)

    def test_manager_login_and_me(self):
        r = self.client.post('/api/auth/login', data=json.dumps({"username": "manager", "password": "manager123"}), content_type='application/json')
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()['is_authenticated'])
        self.assertEqual(r.json()['user']['role'], 'manager')
        r = self.client.get('/api/auth/me')
        self.assertTrue(r.json()['is_authenticated'])
        self.assertTrue(r.json()['is_manager'])

    def test_manager_accesses_staff_endpoints(self):
        self.client.post('/api/auth/login', data=json.dumps({"username": "manager", "password": "manager123"}), content_type='application/json')
        self.assertEqual(self.client.get('/api/orders').status_code, 200)
        self.assertEqual(self.client.get('/api/orders/kitchen_feed').status_code, 200)
        self.assertEqual(self.client.get('/api/auth/me').status_code, 200)

    def test_manager_can_write_menu(self):
        self.client.post('/api/auth/login', data=json.dumps({"username": "manager", "password": "manager123"}), content_type='application/json')
        r = self.client.post('/api/menu/items', data=json.dumps({
            "name": "Test Dish", "slug": "test-dish", "description": "x", "price": 99,
            "category": 1, "food_type": "veg", "is_available": True,
        }), content_type='application/json')
        self.assertEqual(r.status_code, 201)

    def test_kitchen_cannot_write_menu(self):
        self.client.post('/api/auth/login', data=json.dumps({"username": "kitchen", "password": "kitchen123"}), content_type='application/json')
        r = self.client.post('/api/menu/items', data=json.dumps({
            "name": "Bad Dish", "slug": "bad-dish", "description": "x", "price": 99,
            "category": 1, "food_type": "veg", "is_available": True,
        }), content_type='application/json')
        self.assertEqual(r.status_code, 403)

    def test_kitchen_can_access_kitchen_feed(self):
        self.client.post('/api/auth/login', data=json.dumps({"username": "kitchen", "password": "kitchen123"}), content_type='application/json')
        self.assertEqual(self.client.get('/api/orders/kitchen_feed').status_code, 200)
