import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Utensils, 
  QrCode, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  DollarSign, 
  TrendingUp, 
  Layers, 
  LogOut, 
  Lock, 
  AlertCircle,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  Ban,
} from 'lucide-react';
import { MenuItem, RestaurantTable, Order, Category, FoodType, OrderStatus, StaffUser } from '../types';
import { formatINR } from '../lib/storage';
import { HERO_IMAGE, BIRYANI_IMAGE, PANEER_IMAGE, DESSERT_IMAGE } from '../lib/initialData';

interface AdminDashboardProps {
  isAuthenticated: boolean;
  user: StaffUser | null;
  isManager: boolean;
  onLogout: () => void;
  menuItems: MenuItem[];
  categories: Category[];
  tables: RestaurantTable[];
  orders: Order[];
  onAddMenuItem: (item: Omit<MenuItem, 'id' | 'slug'>) => void;
  onUpdateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleAvailability: (id: string) => void;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddTable: (table: Omit<RestaurantTable, 'id' | 'qrCodeUrl' | 'status'>) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCancelOrder: (orderId: string) => void;
  onDeleteOrder: (orderId: string) => void;
  onOpenQRModalForTable: (tableNum: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAuthenticated,
  user,
  isManager,
  onLogout,
  menuItems,
  categories,
  tables,
  orders,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onToggleAvailability,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAddTable,
  onUpdateOrderStatus,
  onCancelOrder,
  onDeleteOrder,
  onOpenQRModalForTable,
}) => {
  if (!isAuthenticated) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'tables' | 'categories'>('overview');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  // New Menu Item Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('biryani');
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState<number>(299);
  const [dishFoodType, setDishFoodType] = useState<FoodType>('veg');
  const [dishImage, setDishImage] = useState(BIRYANI_IMAGE);
  const [dishPrepTime, setDishPrepTime] = useState(15);
  const [dishSpiciness, setDishSpiciness] = useState<'mild' | 'medium' | 'spicy'>('medium');
  const [dishIsActive, setDishIsActive] = useState(true);
  const [dishTags, setDishTags] = useState<string[]>([]);

  // New Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableDisplayName, setTableDisplayName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableSection, setTableSection] = useState<'Ground Floor' | 'Outdoor Terrace' | 'Mezzanine' | 'VIP Lounge'>('Ground Floor');

  const handleOpenAddDish = () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategory('biryani');
    setDishDescription('');
    setDishPrice(299);
    setDishFoodType('veg');
    setDishImage(BIRYANI_IMAGE);
    setDishPrepTime(15);
    setDishSpiciness('medium');
    setDishIsActive(true);
    setDishTags([]);
    setIsDishModalOpen(true);
  };

  const handleOpenEditDish = (item: MenuItem) => {
    setEditingDishId(item.id);
    setDishName(item.name);
    setDishCategory(item.category);
    setDishDescription(item.description);
    setDishPrice(item.price);
    setDishFoodType(item.foodType);
    setDishImage(item.image);
    setDishPrepTime(item.preparationTimeMins || 15);
    setDishSpiciness(item.spiciness || 'medium');
    setDishIsActive(item.isActive !== false);
    setDishTags(item.tags || []);
    setIsDishModalOpen(true);
  };

  const handleSaveDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || dishPrice <= 0) return;

    if (editingDishId) {
      onUpdateMenuItem(editingDishId, {
        name: dishName.trim(),
        category: dishCategory,
        description: dishDescription.trim(),
        price: Number(dishPrice),
        foodType: dishFoodType,
        image: dishImage,
        isAvailable: true,
        isActive: dishIsActive,
        tags: dishTags,
        preparationTimeMins: Number(dishPrepTime),
        spiciness: dishSpiciness,
      });
    } else {
      onAddMenuItem({
        name: dishName.trim(),
        category: dishCategory,
        description: dishDescription.trim(),
        price: Number(dishPrice),
        foodType: dishFoodType,
        image: dishImage,
        isAvailable: true,
        isActive: dishIsActive,
        tags: dishTags,
        preparationTimeMins: Number(dishPrepTime),
        spiciness: dishSpiciness,
      });
    }
    setIsDishModalOpen(false);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumberInput.trim()) return;

    onAddTable({
      tableNumber: tableNumberInput.trim().toUpperCase(),
      displayName: tableDisplayName.trim() || `Table ${tableNumberInput.trim().toUpperCase()}`,
      capacity: Number(tableCapacity),
      section: tableSection,
    });
    setTableNumberInput('');
    setTableDisplayName('');
    setIsTableModalOpen(false);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    await onCancelOrder(orderId);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this completed order?')) return;
    try {
      await onDeleteOrder(orderId);
      setDeleteMessage('Order deleted successfully.');
    } catch {
      setDeleteMessage('Failed to delete order. Please try again.');
    }
  };

  // ============ REAL DATABASE STATISTICS ============
  // Total Orders: count all orders from database
  const totalOrders = orders.length;

  // Gross Revenue: sum of order totals, EXCLUDING cancelled orders
  const grossRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  // Active Tables Occupied: distinct tables with at least one Pending/Preparing/Ready order
  const activeTableNumbers = new Set(
    orders
      .filter((o) => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready')
      .map((o) => o.tableNumber)
  );
  const activeTablesOccupied = activeTableNumbers.size;

  // Pending and preparing count for KPI
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const preparingOrders = orders.filter((o) => o.status === 'preparing').length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Section Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'orders', label: 'Orders' },
            { key: 'menu', label: 'Menu' },
            { key: 'tables', label: 'Tables' },
            { key: 'categories', label: 'Categories' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* KPI Cards - Real Database Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                <span className="text-xs font-medium text-stone-500 block">Total Orders Recorded</span>
                <span className="text-2xl font-black text-stone-900 mt-1 block tabular-nums">
                  {totalOrders}
                </span>
                <span className="text-[11px] text-stone-700 mt-1 block">
                  Live count from PostgreSQL
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                <span className="text-xs font-medium text-stone-500 block">Pending In Kitchen</span>
                <span className="text-2xl font-black text-amber-700 mt-1 block tabular-nums">
                  {pendingOrders + preparingOrders}
                </span>
                <span className="text-[11px] text-stone-700 mt-1 block">
                  {pendingOrders} new · {preparingOrders} preparing
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                <span className="text-xs font-medium text-stone-500 block">Gross Dine-In Revenue</span>
                <span className="text-2xl font-black text-emerald-800 mt-1 block tabular-nums">
                  {formatINR(grossRevenue)}
                </span>
                <span className="text-[11px] text-stone-700 mt-1 block">
                  Excludes cancelled orders
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs">
                <span className="text-xs font-medium text-stone-500 block">Active Tables Occupied</span>
                <span className="text-2xl font-black text-stone-900 mt-1 block tabular-nums">
                  {activeTablesOccupied} / {tables.length}
                </span>
                <span className="text-[11px] text-stone-700 mt-1 block">
                  Distinct tables with active orders
                </span>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-stone-900">Recent Customer Orders</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-stone-100">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-900 font-mono">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-xs text-stone-500">
                          {order.customerName}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        {order.items.length} items · {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-stone-900 tabular-nums">
                        {formatINR(order.total)}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md ${
                        order.status === 'cancelled'
                          ? 'bg-red-50 text-red-700'
                          : order.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.status === 'ready'
                              ? 'bg-blue-50 text-blue-700'
                              : order.status === 'preparing'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-stone-100 text-stone-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="py-6 text-center text-stone-500 text-sm">
                    No orders in the database yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">All Restaurant Orders</h3>
                <p className="text-xs text-stone-500">
                  Update statuses or cancel old pending orders.
                </p>
              </div>
            </div>

            {deleteMessage && (
              <div className={`p-3 rounded-lg text-xs border ${deleteMessage.includes('success') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {deleteMessage}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="pb-3">Order #</th>
                    <th className="pb-3">Table</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Ordered Items</th>
                    <th className="pb-3">Notes</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50">
                      <td className="py-3 font-mono font-bold text-stone-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 font-semibold text-amber-800">
                        {order.tableNumber}
                      </td>
                      <td className="py-3 text-stone-800 font-medium">
                        {order.customerName}
                        {order.customerPhone && (
                          <div className="text-[10px] text-stone-400">{order.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 text-stone-700">
                        {order.items.map((it) => (
                          <div key={it.id}>
                            {it.quantity}x {it.name}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 text-stone-500 max-w-xs truncate">
                        {order.specialInstructions || '—'}
                      </td>
                      <td className="py-3 font-bold text-stone-900 tabular-nums">
                        {formatINR(order.total)}
                      </td>
                      <td className="py-3">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="bg-stone-100 border border-stone-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-amber-600"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenQRModalForTable(order.tableNumber)}
                            className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
                          >
                            Table QR
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold"
                            >
                              Cancel
                            </button>
                          )}
                          {(order.status === 'completed' || order.status === 'served') && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-stone-500 text-sm">
                        No orders in the database yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MENU CATALOG TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Food Items & Pricing</h3>
                <p className="text-xs text-stone-500">
                  Manage dishes, prices, categories, and stock availability.
                </p>
              </div>

              <button
                onClick={handleOpenAddDish}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-lg object-cover bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.foodType === 'veg' ? (
                          <span className="w-3 h-3 rounded-[2px] border border-emerald-600 flex items-center justify-center bg-white shrink-0">
                            <span className="w-1 h-1 rounded-full bg-emerald-600" />
                          </span>
                        ) : (
                          <span className="w-3 h-3 rounded-[2px] border border-red-700 flex items-center justify-center bg-white shrink-0">
                            <span className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[4px] border-b-red-700" />
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-stone-900 truncate">
                          {item.name}
                        </h4>
                      </div>
                      <div className="text-xs font-bold text-amber-800 mt-1 tabular-nums">
                        {formatINR(item.price)}
                      </div>
                      <div className="text-[11px] text-stone-500 capitalize">
                        {item.category} · {item.preparationTimeMins || 15} mins
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onToggleAvailability(item.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <button
                      onClick={() => onUpdateMenuItem(item.id, { isActive: item.isActive === false ? true : false })}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                        item.isActive !== false
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditDish(item)}
                        className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-stone-100 rounded"
                        title="Edit dish"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMenuItem(item.id)}
                        className="p-1.5 text-stone-500 hover:text-red-700 hover:bg-stone-100 rounded"
                        title="Delete dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLES & QR CODES TAB */}
        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Dining Tables & QR Standees</h3>
                <p className="text-xs text-stone-500">
                  Generate table identifiers and QR codes for table-side ordering.
                </p>
              </div>

              <button
                onClick={() => setIsTableModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Restaurant Table</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white rounded-xl border border-stone-200 p-5 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black font-mono text-stone-900">
                        {table.tableNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          table.status === 'occupied'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {table.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-stone-800 mt-1">
                      {table.displayName}
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {table.section} · {table.capacity} Person Seating
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenQRModalForTable(table.tableNumber)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View & Print QR</span>
                    </button>

                    <span className="text-[11px] font-mono text-stone-400">
                      ?table={table.tableNumber}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* DISH CREATE / EDIT MODAL */}
      {isDishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDishModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-stone-900 mb-4 font-serif">
              {editingDishId ? 'Edit Dish Details' : 'Add New Dish to BhojanQR'}
            </h3>

            <form onSubmit={handleSaveDish} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Kashmiri Rogan Josh"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="biryani">Dum Biryani</option>
                    <option value="starters">Starters & Tandoor</option>
                    <option value="curries">Indian Meals & Curries</option>
                    <option value="breads">Breads & Rice</option>
                    <option value="desserts">Royal Desserts</option>
                    <option value="beverages">Beverages & Lassi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={dishPrice}
                    onChange={(e) => setDishPrice(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Food Type</label>
                  <select
                    value={dishFoodType}
                    onChange={(e) => setDishFoodType(e.target.value as FoodType)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="veg">Pure Veg</option>
                    <option value="non-veg">Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min={1}
                    value={dishPrepTime}
                    onChange={(e) => setDishPrepTime(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Culinary Description</label>
                <textarea
                  rows={2}
                  required
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  placeholder="Ingredients, marinade, preparation style..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Active Status</label>
                <button
                  type="button"
                  onClick={() => setDishIsActive((v) => !v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${dishIsActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}
                >
                  {dishIsActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Product Tags</label>
                <div className="flex flex-wrap gap-2">
                  {['Today\'s Trending', 'Most Popular', 'Today\'s Special', 'Chef\'s Special', 'Bestseller'].map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() =>
                        setDishTags((prev) =>
                          prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${dishTags.includes(tag) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-300'}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Biryani', src: BIRYANI_IMAGE },
                    { label: 'Tandoor', src: PANEER_IMAGE },
                    { label: 'Dessert', src: DESSERT_IMAGE },
                    { label: 'Feast', src: HERO_IMAGE },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => setDishImage(p.src)}
                      className={`p-1.5 rounded-lg border text-center transition-all ${
                        dishImage === p.src ? 'border-amber-600 ring-2 ring-amber-200' : 'border-stone-200'
                      }`}
                    >
                      <img src={p.src} alt={p.label} className="w-full h-10 object-cover rounded" />
                      <span className="text-[10px] text-stone-600 block mt-1">{p.label}</span>
                    </button>
                  ))}
                </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {editingDishId ? 'Save Changes' : 'Add Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Menu Categories</h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCategoryName.trim()) return;
                const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                if (editingCategoryId) {
                  onUpdateCategory(editingCategoryId, newCategoryName.trim());
                  setEditingCategoryId(null);
                  setEditingCategoryName('');
                } else {
                  onAddCategory(newCategoryName.trim());
                }
                setNewCategoryName('');
              }}
              className="flex gap-2"
            >
              <input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name"
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
              />
              <button type="submit" className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg">
                {editingCategoryId ? 'Update' : 'Add'}
              </button>
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between border border-stone-200 rounded-lg p-3">
                  <div>
                    <span className="font-semibold text-stone-900">{cat.name}</span>
                    <span className="text-xs text-stone-500 ml-2">({cat.itemCount || 0} items)</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingCategoryId(cat.id);
                        setNewCategoryName(cat.name);
                      }}
                      className="text-xs text-amber-700 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="text-xs text-red-600 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABLE CREATE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative">
            <button
              onClick={() => setIsTableModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-stone-900 mb-4 font-serif">
              Add Restaurant Dining Table
            </h3>

            <form onSubmit={handleSaveTable} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Table Number Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={tableNumberInput}
                  onChange={(e) => setTableNumberInput(e.target.value)}
                  placeholder="e.g. T-07 or VIP-01"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Display / Location Name
                </label>
                <input
                  type="text"
                  value={tableDisplayName}
                  onChange={(e) => setTableDisplayName(e.target.value)}
                  placeholder="e.g. Table 7 (Courtyard Cabana)"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Section</label>
                  <select
                    value={tableSection}
                    onChange={(e) => setTableSection(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Outdoor Terrace">Outdoor Terrace</option>
                    <option value="Mezzanine">Mezzanine</option>
                    <option value="VIP Lounge">VIP Lounge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Create Table & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
