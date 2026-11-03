import json
from django.test import Client

c = Client()

print("=== 1. Unauthenticated access to staff-only /api/orders/ (should be 403) ===")
r = c.get('/api/orders/')
print("Status:", r.status_code, "(expected 403)")

print("\n=== 2. Unauthenticated order creation via /api/orders/ POST (should be 201) ===")
r = c.post('/api/orders/', data=json.dumps({
    "table_identifier": "T-01",
    "customer_name": "Guest",
    "customer_phone": "",
    "special_instructions": "",
    "order_items_input": [{"menu_item_id": 1, "quantity": 2}],
}), content_type='application/json')
print("Status:", r.status_code, "(expected 201)")
if r.status_code == 201:
    print("Order number:", r.json().get('order_number'))

print("\n=== 3. Unauthenticated order tracking /api/orders/track/BHOJAN-XXXXX (should be 404 for nonexistent) ===")
r = c.get('/api/orders/track/BHOJAN-XXXXX/')
print("Status:", r.status_code, "(expected 404)")

print("\n=== 4. Login as manager ===")
r = c.post('/api/auth/login', data=json.dumps({"username": "manager", "password": "manager123"}), content_type='application/json')
print("Login status:", r.status_code)
print("Login body:", r.json())

print("\n=== 5. Authenticated manager /api/auth/me (should be authenticated manager) ===")
r = c.get('/api/auth/me')
print("Status:", r.status_code)
print("Body:", r.json())

print("\n=== 6. Authenticated manager staff orders list /api/orders/ (should be 200) ===")
r = c.get('/api/orders/')
print("Status:", r.status_code, "(expected 200)")

print("\n=== 7. Authenticated manager kitchen feed /api/orders/kitchen_feed/ (should be 200) ===")
r = c.get('/api/orders/kitchen_feed/')
print("Status:", r.status_code, "(expected 200)")

print("\n=== 8. Authenticated manager create menu item (should be 201) ===")
r = c.post('/api/menu/items/', data=json.dumps({
    "name": "Test Dish", "slug": "test-dish", "description": "x", "price": 99,
    "category": 1, "food_type": "veg", "is_available": True,
}), content_type='application/json')
print("Status:", r.status_code, "(expected 201)")

print("\n=== 9. Logout manager ===")
r = c.post('/api/auth/logout', content_type='application/json')
print("Logout status:", r.status_code)

print("\n=== 10. Login as kitchen ===")
r = c.post('/api/auth/login', data=json.dumps({"username": "kitchen", "password": "kitchen123"}), content_type='application/json')
print("Login status:", r.status_code)
print("Body:", r.json())

print("\n=== 11. Authenticated kitchen kitchen_feed (should be 200) ===")
r = c.get('/api/orders/kitchen_feed/')
print("Status:", r.status_code, "(expected 200)")

print("\n=== 12. Authenticated kitchen create menu item (should be 403 - kitchen can't write menu) ===")
r = c.post('/api/menu/items/', data=json.dumps({
    "name": "Bad Dish", "slug": "bad-dish", "description": "x", "price": 99,
    "category": 1, "food_type": "veg", "is_available": True,
}), content_type='application/json')
print("Status:", r.status_code, "(expected 403)")

print("\n=== 13. Authenticated kitchen update order status (should be 200) ===")
# find a pending order
r = c.get('/api/orders/kitchen_feed/')
orders = r.json()
oid = orders[0]['id'] if orders else None
if oid:
    r = c.patch(f'/api/orders/{oid}/update_status/', data=json.dumps({"status": "preparing"}), content_type='application/json')
    print("Status:", r.status_code, "(expected 200)")

print("\nALL PERMISSION TESTS COMPLETE")
