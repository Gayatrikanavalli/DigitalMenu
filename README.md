

## 1. Technology Stack Specification

| Component | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend** | Next.js / React with Tailwind CSS & Axios | 14.x / 19.x | Customer Menu, KDS, Admin Portal, Table QR Manager |
| **Backend** | Python & Django REST Framework | Django 5.0+, DRF 3.14+ | REST APIs, authentication, permissions, order logic |
| **Database** | PostgreSQL | 15 | Relational ACID storage, authoritative decimal pricing |
| **QR Generation** | Python `qrcode` library | 7.4+ (Pillow) | Table-specific QR codes with High-Error-Correction |
| **Containerization** | Docker & Docker Compose | 3.8 Spec | Multi-container automated orchestration |

---

## 2. Project Directory Structures

```
digitalmenu/
├── backend/                        # Django 5 REST Backend
│   ├── config/                     # Django project configuration
│   │   ├── __init__.py
│   │   ├── settings.py             # PostgreSQL DATABASES configuration & CORS
│   │   ├── urls.py                 # Root URL router
│   │   ├── wsgi.py                 # WSGI production server entrypoint
│   │   └── asgi.py                 # ASGI entrypoint
│   ├── menu/                       # Menu & Categories Django App
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py               # Category and MenuItem models
│   │   ├── serializers.py          # DRF Serializers
│   │   ├── views.py                # ViewSets with filtering & search
│   │   ├── urls.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py     # Initial PostgreSQL migration
│   ├── tables/                     # Tables & QR Code Generator App
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py               # RestaurantTable model
│   │   ├── serializers.py
│   │   ├── views.py                # TableViewSet & Python qrcode generator
│   │   ├── urls.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   ├── orders/                     # Orders & Kitchen KDS App
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py               # Order and OrderItem models
│   │   ├── serializers.py          # Server-locked price calculation
│   │   ├── views.py                # OrderViewSet, status updates, kitchen_feed
│   │   ├── urls.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   ├── initial_seed.json           # Initial database seed fixture
│   ├── entrypoint.sh               # Docker container wait-for-db & migrate script
│   ├── Dockerfile                  # Python 3.10 slim container definition
│   ├── requirements.txt            # Python dependencies
│   └── .env.example
├── frontend/                       # Next.js 14 Frontend Application
│   ├── app/
│   │   ├── layout.tsx              # Root HTML & fonts layout
│   │   ├── page.tsx                # Next.js 14 client page entrypoint
│   │   └── globals.css             # Tailwind CSS styles
│   ├── lib/
│   │   └── axios.ts                # Configured Axios client
│   ├── next.config.js              # Next.js 14 configuration
│   ├── tailwind.config.js          # Tailwind styling configuration
│   ├── postcss.config.js
│   ├── package.json                # Dependencies: next, react, axios, lucide, qrcode
│   └── Dockerfile                  # Next.js 14 multi-stage production container
├── src/                            # Shared Interactive Application Source
│   ├── App.tsx                     # Master component connecting Customer, Kitchen & Admin
│   ├── components/                 # Reusable UI components
│   │   ├── Header.tsx              # Top bar contract with table indicator & search
│   │   ├── HeroBanner.tsx          # High-impact culinary banner
│   │   ├── CategoryBar.tsx         # Category carousel & Pure Veg / Non-Veg filter
│   │   ├── MenuCard.tsx            # Food card with quantity steppers & badges
│   │   ├── CartDrawer.tsx          # Order customization & checkout slide-over
│   │   ├── OrderConfirmationModal.tsx # Live order tracker
│   │   ├── KitchenDashboard.tsx    # Dedicated Kitchen Display System (KDS)
│   │   ├── AdminDashboard.tsx      # Admin metrics, dish CRUD, table manager
│   │   ├── TableQRModal.tsx        # QR code generator, print standee, scan simulator
│   │   ├── DjangoCodeModal.tsx     # Full architecture inspector
│   │   └── Footer.tsx              # Restaurant info & assignment notes
│   ├── lib/
│   │   ├── axios.ts                # Real Axios HTTP client instance
│   │   ├── api.ts                  # DRF API client with cache fallback buffer
│   │   └── storage.ts              # Data persistence & reactive state
│   └── types/                      # TypeScript domain definitions
├── docker-compose.yml              # Complete multi-container stack orchestration
├── Dockerfile                      # Root container build definition
└── README.md
```

---

## 3. Database Schema & PostgreSQL 15 Migrations

All models are defined with appropriate decimal precision, constraints, and foreign keys:

### 1. `menu.Category`
- `id`: AutoField (PK)
- `name`: `CharField(max_length=100)` — e.g. "Dum Biryani"
- `slug`: `SlugField(unique=True)` — e.g. "biryani"
- `icon`: `CharField(max_length=50)` — Lucide icon identifier
- `order`: `PositiveIntegerField` — Display order

### 2. `menu.MenuItem`
- `id`: AutoField (PK)
- `category`: `ForeignKey(Category, on_delete=CASCADE)`
- `name`: `CharField(max_length=200)`
- `slug`: `SlugField(unique=True)`
- `description`: `TextField`
- `price`: `DecimalField(max_digits=10, decimal_places=2)` — Authoritative pricing in INR
- `food_type`: `CharField(choices=['veg', 'non-veg'])`
- `is_available`: `BooleanField(default=True)`
- `is_special`: `BooleanField(default=False)`
- `preparation_time_mins`: `PositiveIntegerField(default=15)`

### 3. `tables.RestaurantTable`
- `id`: AutoField (PK)
- `table_number`: `CharField(max_length=20, unique=True)` — e.g. "T-01"
- `display_name`: `CharField(max_length=100)` — e.g. "Table 1 (Window Side)"
- `capacity`: `PositiveIntegerField(default=4)`
- `section`: `CharField(choices=['Ground Floor', 'Outdoor Terrace', 'Mezzanine', 'VIP Lounge'])`
- `qr_code_image`: `ImageField(upload_to='qrcodes/')`

### 4. `orders.Order`
- `id`: AutoField (PK)
- `order_number`: `CharField(max_length=50, unique=True)` — e.g. "BHOJAN-4921"
- `table`: `ForeignKey(RestaurantTable, on_delete=PROTECT)`
- `customer_name`: `CharField(max_length=120)`
- `customer_phone`: `CharField(max_length=25, blank=True)`
- `special_instructions`: `TextField(blank=True)`
- `status`: `CharField(choices=['pending', 'preparing', 'ready', 'completed', 'cancelled'])`
- `subtotal`: `DecimalField(max_digits=10, decimal_places=2)`
- `tax`: `DecimalField(max_digits=10, decimal_places=2)` — 5% Restaurant GST
- `total`: `DecimalField(max_digits=10, decimal_places=2)`

### 5. `orders.OrderItem`
- `id`: AutoField (PK)
- `order`: `ForeignKey(Order, on_delete=CASCADE)`
- `menu_item`: `ForeignKey(MenuItem, on_delete=PROTECT)`
- `name`: `CharField(max_length=200)`
- `price`: `DecimalField(max_digits=10, decimal_places=2)` — Locked at moment of order
- `quantity`: `PositiveIntegerField(default=1)`
- `food_type`: `CharField(max_length=10)`
- `special_notes`: `CharField(max_length=255, blank=True)`

---

## 4. REST API Endpoints Specification

| Method | Endpoint | Query / Payload | Description |
|---|---|---|---|
| `GET` | `/api/menu/categories/` | — | Returns list of categories with items count |
| `GET` | `/api/menu/items/` | `?category=biryani&food_type=veg&search=paneer` | List & filter dishes |
| `POST` | `/api/menu/items/` | `{ name, price, category, ... }` | Add new dish (Admin) |
| `PATCH` | `/api/menu/items/{id}/` | `{ price, is_available }` | Edit dish or toggle stock |
| `DELETE` | `/api/menu/items/{id}/` | — | Remove dish from catalog |
| `GET` | `/api/tables/` | — | List all restaurant tables |
| `POST` | `/api/tables/` | `{ table_number, display_name, capacity, section }` | Create table and auto-generate QR |
| `GET` | `/api/tables/{id}/generate_qr/` | — | Generate & fetch table QR PNG via Python `qrcode` |
| `GET` | `/api/orders/` | `?table=T-01&status=pending` | List orders |
| `POST` | `/api/orders/` | `{ table_identifier, customer_name, order_items_input }` | Place order (prices calculated server-side) |
| `PATCH` | `/api/orders/{id}/update_status/` | `{ status: 'preparing' }` | Advance order status (`pending` → `preparing` → `ready` → `completed`) |
| `GET` | `/api/orders/kitchen_feed/` | — | Real-time polling feed for active kitchen tickets |

---

## 5. Setup & Execution Instructions

### Option 1: Automated Launch with Docker Compose (Recommended)

1. Ensure Docker Desktop is running.
2. In the project root, run:
   ```bash
   docker compose up --build
   ```
3. Docker Compose will automatically:
   - Start PostgreSQL 15 on port `5432` and verify health.
   - Run database migrations (`python manage.py migrate`).
   - Load seed categories and dishes (`python manage.py loaddata initial_seed.json`).
   - Start Django REST Framework on `http://0.0.0.0:8000` (reachable from other devices on the LAN).
   - Start the Next.js frontend on `http://0.0.0.0:3000` (reachable from other devices on the LAN).

   From a phone on the same Wi-Fi, replace `localhost` with the laptop's LAN IP (see "Testing on a phone" below).

---

### Option 2: Running Locally Without Docker

#### Step 1: Start PostgreSQL 15
```sql
CREATE DATABASE bhojan_db;
CREATE USER bhojan_user WITH PASSWORD 'bhojan_secure_password_2026';
GRANT ALL PRIVILEGES ON DATABASE bhojan_db TO bhojan_user;
```

#### Step 2: Setup & Run Django 5 Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Apply migrations and load seed data
python manage.py migrate
python manage.py loaddata initial_seed.json

# (Optional) Create superuser for Django admin
python manage.py createsuperuser --username admin --email admin@bhojanqr.com

# Start Django development server
python manage.py runserver 0.0.0.0:8000
```
- Django REST API: `http://localhost:8000/api/` (from a phone: `http://<LAN-IP>:8000/api/`)
- Django Admin: `http://localhost:8000/admin/` (from a phone: `http://<LAN-IP>:8000/admin/`)

#### Step 3: Setup & Run Frontend (Next.js 14 / Vite)
```bash
# In the project root:
npm install
npm run dev
```
Open `http://localhost:3000` in your browser (from a phone: `http://<LAN-IP>:3000`).

---

## 6. End-to-End Workflow Verification Steps

1. **Table QR Code Verification:**
   - Click **Admin Portal** (or Table QR badge).
   - Select Table `T-01` or `T-02`.
    - Click **Simulate Scan & Order as Table X** (or visit `http://localhost:3000/?table=T-01`; from a phone use `http://<LAN-IP>:3000/?table=T-01`).
   - Notice the header locks to `Table T-01`.
2. **Customer Order Placement:**
   - Filter by **Pure Veg** or search for "Biryani".
   - Click **Add** on dishes, customize quantities in the Cart Drawer.
   - Enter diner name (e.g., "Aarav Sharma") and cooking instructions.
   - Click **Confirm & Send to Kitchen**.
   - Unique order ticket (e.g., `#BHOJAN-101`) appears with live tracking progress.
3. **Kitchen Display System (KDS):**
   - Click **Kitchen Display** in the navigation header.
   - Notice the new ticket appears with diner notes highlighted in amber.
   - Click **Start Cooking** → moves to `preparing`.
   - Click **Ready to Serve** → moves to `ready`.
   - Notice customer screen updates in real-time.
4. **Admin Dashboard:**
   - Log in (`admin` / `admin123`).
   - Review live metrics (Revenue, Pending orders, Active tables).
   - Test adding a new dining table or new dish to the catalog.

## 6.1 Testing on a phone (same Wi-Fi)

Table QR codes embed a full URL, so `localhost` on a phone would point at the phone itself, not your laptop. To scan QR codes and use the app from a phone on the same Wi-Fi:

1. **Find your laptop's IP** — open PowerShell and run `ipconfig`; note the IPv4 Address of your Wi-Fi adapter (e.g. `192.168.1.5`).
2. **Set the environment variables** — copy `backend/.env.example` to `backend/.env` (or set them in `docker-compose.yml`) and set:
   - `FRONTEND_PUBLIC_URL=http://192.168.1.5:3000`
   - `NEXT_PUBLIC_API_URL=http://192.168.1.5:8000/api`
   Replace `192.168.1.5` with your laptop's actual IP.
3. **Start the stack** — `docker compose up --build`. Next.js listens on `0.0.0.0:3000` and Django binds `0.0.0.0:8000`; ports `3000` and `8000` are published.
4. **Regenerate the QR codes** — the saved images in `media/qrcodes` still contain `localhost`:
   ```bash
   docker compose exec backend python manage.py regenerate_qr_codes
   ```
5. **Use the same Wi-Fi** — connect the phone to the same network as the laptop and open `http://192.168.1.5:3000/?table=T-01` (or scan a table QR code).
6. **Windows Firewall** — allow inbound traffic on ports `3000` and `8000` (Control Panel → Windows Defender Firewall → Advanced Settings → Inbound Rules → New Rule → Port).

---

## 7. Submission Checklist for Atronz Innovations
- [x] Full Next.js 14 / React frontend with responsive UI and warm saffron/amber styling
- [x] Axios HTTP client instance in `src/lib/axios.ts` and `frontend/lib/axios.ts`
- [x] Complete Django 5 REST backend with proper `apps.py`, `__init__.py`, and URL routing
- [x] PostgreSQL 15 configuration with initial migration files in `backend/*/migrations/`
- [x] Trusted server-side price validation preventing client-side price tampering
- [x] Python `qrcode` library generator for table URLs
- [x] Kitchen Display System (KDS) with live order status progression
- [x] Docker Compose multi-service orchestration with health checks
