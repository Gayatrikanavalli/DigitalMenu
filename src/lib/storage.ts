import { Category, MenuItem, RestaurantTable, Order, OrderStatus, CartItem, OrderItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_MENU_ITEMS, INITIAL_TABLES, INITIAL_ORDERS } from './initialData';

const KEYS = {
  CATEGORIES: 'bhojan_categories_v2',
  MENU_ITEMS: 'bhojan_menu_items_v2',
  TABLES: 'bhojan_tables_v2',
  ORDERS: 'bhojan_orders_v2',
  ACTIVE_TABLE: 'bhojan_active_table_v2',
  ACTIVE_ORDER_ID: 'bhojan_active_order_id_v2',
};

const LEGACY_MENU_IMAGE_FIXES: Record<string, { from: string; to: string }> = {
  'dish-102': {
    from: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-208': {
    from: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-402': {
    from: 'https://images.unsplash.com/photo-1505253758473-96b3015f240a?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-501': {
    from: 'https://images.unsplash.com/photo-1505253758473-96b3015f240a?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-506': {
    from: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-602': {
    from: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-105': {
    from: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-106': {
    from: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-107': {
    from: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-201': {
    from: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-203': {
    from: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-205': {
    from: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-206': {
    from: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-207': {
    from: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-305': {
    from: 'https://images.unsplash.com/photo-1618449840665-9ed506d73a34?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-306': {
    from: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-307': {
    from: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-308': {
    from: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-403': {
    from: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-406': {
    from: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-407': {
    from: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-502': {
    from: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-503': {
    from: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-504': {
    from: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-505': {
    from: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-507': {
    from: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-8': {
    from: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-601': {
    from: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-603': {
    from: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
  'dish-604': {
    from: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    to: '',
  },
};

const INITIAL_MENU_IMAGE_BY_ID = new Map(INITIAL_MENU_ITEMS.map(({ id, image }) => [id, image]));

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToStore(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Store listener error:', err);
    }
  });
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

// Storage Helpers
export function getCategories(): Category[] {
  try {
    const raw = localStorage.getItem(KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < INITIAL_CATEGORIES.length) {
      localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
      return INITIAL_CATEGORIES;
    }
    return parsed;
  } catch {
    return INITIAL_CATEGORIES;
  }
}

export function getMenuItems(): MenuItem[] {
  try {
    const raw = localStorage.getItem(KEYS.MENU_ITEMS);
    if (!raw) {
      localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length < 20) {
      localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    }
    const updated = parsed.map((item: MenuItem) => {
      const fix = LEGACY_MENU_IMAGE_FIXES[item.id];
      let fixed = fix && item.image === fix.from
        ? { ...item, image: INITIAL_MENU_IMAGE_BY_ID.get(item.id) ?? fix.to }
        : item;
      // Ensure every item has a valid image: fall back to initial data if empty/missing
      if (!fixed.image) {
        fixed = { ...fixed, image: INITIAL_MENU_IMAGE_BY_ID.get(item.id) ?? fixed.image };
      }
      return fixed;
    });
    if (updated.some((item: MenuItem, index: number) => item !== parsed[index])) {
      localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(updated));
    }
    return updated;
  } catch {
    return INITIAL_MENU_ITEMS;
  }
}

export function saveMenuItems(items: MenuItem[]) {
  localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(items));
  notifyListeners();
}

export function saveCategories(items: Category[]) {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(items));
  notifyListeners();
}

export function getTables(): RestaurantTable[] {
  try {
    const raw = localStorage.getItem(KEYS.TABLES);
    if (!raw) {
      localStorage.setItem(KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
      return INITIAL_TABLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TABLES;
  }
}

export function saveTables(tables: RestaurantTable[]) {
  localStorage.setItem(KEYS.TABLES, JSON.stringify(tables));
  notifyListeners();
}

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  notifyListeners();
}

export function getActiveTable(): string {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      localStorage.setItem(KEYS.ACTIVE_TABLE, tableParam.toUpperCase());
      return tableParam.toUpperCase();
    }
    const stored = localStorage.getItem(KEYS.ACTIVE_TABLE);
    return stored || 'T-01';
  } catch {
    return 'T-01';
  }
}

export function setActiveTable(tableNum: string) {
  localStorage.setItem(KEYS.ACTIVE_TABLE, tableNum.toUpperCase());
  notifyListeners();
}

export function getActiveOrderId(): string | null {
  try {
    return localStorage.getItem(KEYS.ACTIVE_ORDER_ID);
  } catch {
    return null;
  }
}

export function setActiveOrderId(id: string | null) {
  if (id) {
    localStorage.setItem(KEYS.ACTIVE_ORDER_ID, id);
  } else {
    localStorage.removeItem(KEYS.ACTIVE_ORDER_ID);
  }
  notifyListeners();
}

// Order Creation with trusted price calculations (simulating backend trusted validation)
export function createOrder({
  tableNumber,
  customerName,
  customerPhone,
  specialInstructions,
  cartItems,
}: {
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  specialInstructions?: string;
  cartItems: CartItem[];
}): Order {
  const allDishes = getMenuItems();
  const dishMap = new Map(allDishes.map((d) => [d.id, d]));

  const orderItems: OrderItem[] = cartItems.map((ci) => {
    // Look up trusted price from master menu
    const masterDish = dishMap.get(ci.menuItem.id) || ci.menuItem;
    return {
      id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      menuItemId: masterDish.id,
      name: masterDish.name,
      price: masterDish.price,
      quantity: ci.quantity,
      foodType: masterDish.foodType,
      specialNotes: ci.specialNotes || '',
    };
  });

  const subtotal = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const tax = Number((subtotal * 0.05).toFixed(2)); // 5% GST
  const total = Number((subtotal + tax).toFixed(2));

  const orderNum = `BHOJAN-${Math.floor(100 + Math.random() * 900)}`;

  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderNum,
    tableNumber,
    customerName: customerName.trim() || 'Guest Diner',
    customerPhone: customerPhone?.trim() || '',
    items: orderItems,
    specialInstructions: specialInstructions?.trim() || '',
    status: 'pending',
    subtotal,
    tax,
    total,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedMinutes: 20,
  };

  const currentOrders = getOrders();
  const updatedOrders = [newOrder, ...currentOrders];
  saveOrders(updatedOrders);

  // Update table status to occupied
  const tables = getTables();
  const tableIdx = tables.findIndex((t) => t.tableNumber.toUpperCase() === tableNumber.toUpperCase());
  if (tableIdx >= 0) {
    tables[tableIdx].status = 'occupied';
    tables[tableIdx].activeOrderId = newOrder.id;
    saveTables(tables);
  }

  setActiveOrderId(newOrder.id);
  return newOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus): boolean {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;

  orders[idx].status = newStatus;
  orders[idx].updatedAt = new Date().toISOString();
  saveOrders(orders);

  // If completed, release table if this was the active order
  if (newStatus === 'completed' || newStatus === 'cancelled') {
    const tables = getTables();
    const tableIdx = tables.findIndex((t) => t.activeOrderId === orderId);
    if (tableIdx >= 0) {
      tables[tableIdx].status = 'available';
      tables[tableIdx].activeOrderId = undefined;
      saveTables(tables);
    }
  }

  return true;
}

export function toggleMenuItemAvailability(id: string): MenuItem | null {
  const items = getMenuItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx].isAvailable = !items[idx].isAvailable;
  saveMenuItems(items);
  return items[idx];
}

export function addMenuItem(item: Omit<MenuItem, 'id' | 'slug'>): MenuItem {
  const items = getMenuItems();
  const newItem: MenuItem = {
    ...item,
    id: `dish-${Date.now()}`,
    slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    rating: 4.8,
    reviewCount: 1,
  };
  saveMenuItems([newItem, ...items]);
  return newItem;
}

export function updateMenuItem(id: string, updates: Partial<MenuItem>): MenuItem | null {
  const items = getMenuItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  saveMenuItems(items);
  return items[idx];
}

export function deleteMenuItem(id: string): boolean {
  const items = getMenuItems();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveMenuItems(filtered);
  return true;
}

export function addRestaurantTable(table: Omit<RestaurantTable, 'id' | 'qrCodeUrl' | 'status'>): RestaurantTable {
  const tables = getTables();
  const newTable: RestaurantTable = {
    ...table,
    id: `tbl-${Date.now()}`,
    qrCodeUrl: `?table=${table.tableNumber}`,
    status: 'available',
  };
  saveTables([...tables, newTable]);
  return newTable;
}

export function resetDemoData() {
  localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
  localStorage.setItem(KEYS.MENU_ITEMS, JSON.stringify(INITIAL_MENU_ITEMS));
  localStorage.setItem(KEYS.TABLES, JSON.stringify(INITIAL_TABLES));
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
  localStorage.setItem(KEYS.ACTIVE_TABLE, 'T-01');
  localStorage.removeItem(KEYS.ACTIVE_ORDER_ID);
  notifyListeners();
}

export function clearCachedData() {
  localStorage.removeItem(KEYS.CATEGORIES);
  localStorage.removeItem(KEYS.MENU_ITEMS);
  localStorage.removeItem(KEYS.TABLES);
  localStorage.removeItem(KEYS.ORDERS);
  localStorage.removeItem(KEYS.ACTIVE_TABLE);
  localStorage.removeItem(KEYS.ACTIVE_ORDER_ID);
  notifyListeners();
}
