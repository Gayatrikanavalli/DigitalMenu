export type FoodType = 'veg' | 'non-veg';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  itemCount?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  image: string;
  foodType: FoodType;
  isAvailable: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  popularity?: number;
  tags?: string[];
  orderCount?: number;
  isPopular?: boolean;
  isSpecial?: boolean;
  spiciness?: 'mild' | 'medium' | 'spicy';
  preparationTimeMins?: number;
  rating?: number;
  reviewCount?: number;
}

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  displayName: string;
  capacity: number;
  section: 'Ground Floor' | 'Outdoor Terrace' | 'Mezzanine' | 'VIP Lounge';
  qrCodeUrl: string;
  activeOrderId?: string;
  status: 'available' | 'occupied' | 'reserved';
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'served';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  foodType: FoodType;
  specialNotes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  specialInstructions?: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  estimatedMinutes?: number;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export type ActiveView = 'customer' | 'admin' | 'kitchen';

export type StaffRole = 'manager' | 'kitchen';

export type LoginIntended = 'admin' | 'kitchen';

export interface StaffUser {
  username: string;
  role: StaffRole;
  is_manager: boolean;
}

export interface AuthState {
  is_authenticated: boolean;
  user: StaffUser | null;
  is_manager: boolean;
  is_kitchen_staff: boolean;
}
