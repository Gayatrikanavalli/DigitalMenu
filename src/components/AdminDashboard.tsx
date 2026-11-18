import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
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
  onAddMenuItem: (item: any) => void | Promise<void>;
  onUpdateMenuItem: (id: string, updates: any) => void | Promise<void>;
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
  onCategoriesSynced?: (categories: Category[]) => void;
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
  onCategoriesSynced,
}) => {
  if (!isAuthenticated) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'tables' | 'categories'>('overview');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [ordersView, setOrdersView] = useState<'active' | 'history'>('active');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const [dishSuccess, setDishSuccess] = useState<string | null>(null);

  // New Menu Item Modal State
  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategoryId, setDishCategoryId] = useState<string>('');
  const [dishError, setDishError] = useState<string | null>(null);
  const [dishSaving, setDishSaving] = useState(false);
  const [dishAdvancedOpen, setDishAdvancedOpen] = useState(false);
  const [dishImage, setDishImage] = useState('');
  const [dishImageFile, setDishImageFile] = useState<File | null>(null);
  const [dishImageSource, setDishImageSource] = useState<'none' | 'suggestion' | 'preset' | 'url' | 'upload' | 'existing'>('none');
  const [dishImageManual, setDishImageManual] = useState(false);
  const [dishImageSearching, setDishImageSearching] = useState(false);
  const [dishImageSuggestion, setDishImageSuggestion] = useState<string | null>(null);
  const [categoriesSyncing, setCategoriesSyncing] = useState(false);
  const [categoriesSynced, setCategoriesSynced] = useState(false);
  const [modalCategories, setModalCategories] = useState<Category[]>([]);

  const isSyncedCategoryId = (id: string) => /^\d+$/.test(String(id || '').trim()) && Number(id) > 0;
  const syncedModalCategories = (modalCategories.length ? modalCategories : categories).filter((c) => isSyncedCategoryId(c.id));

  useEffect(() => {
    if (!isDishModalOpen) return;
    if (syncedModalCategories.length === 0) return;
    if (!dishCategoryId || !syncedModalCategories.some((c) => String(c.id) === String(dishCategoryId))) {
      setDishCategoryId(String(syncedModalCategories[0].id));
    }
  }, [isDishModalOpen, dishCategoryId, syncedModalCategories.map((c) => c.id).join(',')]);
  const [dishDescription, setDishDescription] = useState('');
  const [dishPrice, setDishPrice] = useState<number>(299);
  const [dishFoodType, setDishFoodType] = useState<FoodType>('veg');
  const [dishPrepTime, setDishPrepTime] = useState(15);
  const [dishSpiciness, setDishSpiciness] = useState<'mild' | 'medium' | 'spicy'>('medium');
  const [dishIsActive, setDishIsActive] = useState(true);
  const [dishTags, setDishTags] = useState<string[]>([]);
  const [dishDiscount, setDishDiscount] = useState(0);
  const [dishOfferActive, setDishOfferActive] = useState(false);
  const [dishOfferStart, setDishOfferStart] = useState('');
  const [dishOfferEnd, setDishOfferEnd] = useState('');

  // New Table Modal State
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [tableDisplayName, setTableDisplayName] = useState('');
  const [tableCapacity, setTableCapacity] = useState(4);
  const [tableSection, setTableSection] = useState<'Ground Floor' | 'Outdoor Terrace' | 'Mezzanine' | 'VIP Lounge'>('Ground Floor');
  const [tableSaving, setTableSaving] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableSuccess, setTableSuccess] = useState<string | null>(null);

  const refreshSyncedCategories = async (): Promise<Category[]> => {
    setCategoriesSyncing(true);
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Category request timed out after 15s.')), 15000)
      );
      const fresh = await Promise.race([api.categories.list({ strict: true }), timeoutPromise]);
      if (!Array.isArray(fresh)) throw new Error('Invalid categories response format.');
      setModalCategories(fresh);
      try { onCategoriesSynced?.(fresh); } catch (e) { console.error('onCategoriesSynced error', e); }
      const synced = fresh.filter((c) => isSyncedCategoryId(c.id));
      if (synced.length === 0) {
        setCategoriesSynced(false);
        setDishCategoryId('');
        setDishError('No categories found on the server. Create categories first, then refresh.');
      } else {
        setCategoriesSynced(true);
        setDishError((prev) => (prev && /categor/i.test(prev) ? null : prev));
        setDishCategoryId((prev) => {
          if (prev && synced.some((c) => String(c.id) === String(prev))) return prev;
          return String(synced[0].id);
        });
      }
      return fresh;
    } catch (err: any) {
      console.error('refreshSyncedCategories failed:', err);
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.response?.data?.error;
      const msg = detail || err?.message || 'Failed to fetch categories.';
      const existingSynced = (modalCategories.length ? modalCategories : categories).filter((c) => isSyncedCategoryId(c.id));
      if (existingSynced.length > 0) {
        // Keep already-loaded categories usable; don't block with a hard error on transient refresh failures.
        setCategoriesSynced(true);
        setModalCategories((prev) => (prev.length ? prev : existingSynced));
        setDishCategoryId((prev) => {
          if (prev && existingSynced.some((c) => String(c.id) === String(prev))) return prev;
          return String(existingSynced[0].id);
        });
        setDishError((prev) => prev && !/categor/i.test(prev) ? prev : null);
        console.warn('Using cached synced categories after refresh failure:', msg);
      } else {
        setCategoriesSynced(false);
        setDishError(`Failed to load categories${status ? ` (HTTP ${status})` : ''}: ${msg}`);
      }
      return (modalCategories.length ? modalCategories : categories).filter((c) => isSyncedCategoryId(c.id)).length
        ? (modalCategories.length ? modalCategories : categories)
        : [];
    } finally {
      setCategoriesSyncing(false);
    }
  };

  const handleOpenAddDish = async () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategoryId('');
    setDishDescription('');
    setDishPrice(299);
    setDishFoodType('veg');
    setDishImage('');
    setDishImageFile(null);
    setDishImageSource('none');
    setDishImageManual(false);
    setDishImageSearching(false);
    setDishImageSuggestion(null);
    setDishPrepTime(15);
    setDishSpiciness('medium');
    setDishIsActive(true);
    setDishTags([]);
    setDishDiscount(0);
    setDishOfferActive(false);
    setDishOfferStart('');
    setDishOfferEnd('');
    setDishError(null);
    setDishSuccess(null);
    setDishSaving(false);
    setDishAdvancedOpen(false);
    setModalCategories([]);
    setCategoriesSynced(false);
    setIsDishModalOpen(true);
    void refreshSyncedCategories();
  };

  const handleOpenEditDish = async (item: MenuItem) => {
    setEditingDishId(item.id);
    setDishName(item.name);
    const matched = categories.find((c) => c.slug === item.category || String(c.id) === String(item.category));
    setDishCategoryId(matched && isSyncedCategoryId(matched.id) ? String(matched.id) : '');
    setDishDescription(item.description);
    setDishPrice(item.price);
    setDishFoodType(item.foodType);
    setDishImage(item.image || '');
    setDishImageFile(null);
    setDishImageSource(item.image ? 'existing' : 'none');
    setDishImageManual(true);
    setDishImageSearching(false);
    setDishImageSuggestion(null);
    setDishPrepTime(Math.max(1, item.preparationTimeMins || 15));
    setDishSpiciness(item.spiciness || 'medium');
    setDishIsActive(item.isActive !== false);
    const tags = item.tags || [];
    const discount = Math.max(0, Math.min(99, Number(item.discountPercentage || 0)));
    const offerActive = !!item.offerActive && discount > 0;
    const offerStart = item.offerStartDate || '';
    const offerEnd = item.offerEndDate || '';
    setDishTags(tags);
    setDishDiscount(discount);
    setDishOfferActive(offerActive);
    setDishOfferStart(offerStart);
    setDishOfferEnd(offerEnd);
    setDishError(null);
    setDishSuccess(null);
    setDishSaving(false);
    setDishAdvancedOpen(discount > 0 || offerActive || !!offerStart || !!offerEnd || tags.length > 0);
    setModalCategories([]);
    setCategoriesSynced(false);
    setIsDishModalOpen(true);
    void refreshSyncedCategories();
  };

  useEffect(() => {
    if (!isDishModalOpen) return;
    const name = dishName.trim();
    if (name.length < 2) {
      setDishImageSuggestion(null);
      setDishImageSearching(false);
      return;
    }
    if (dishImageManual) return;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const tokens = Array.from(new Set(normalize(name).split(' ').filter((t) => t.length >= 3)));

    let cancelled = false;
    const controller = new AbortController();
    setDishImageSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const query = encodeURIComponent(`${name} food dish`);
        const resp = await fetch(
          `https://api.openverse.org/v1/images/?q=${query}&page_size=12&license_type=commercial,modification`,
          { signal: controller.signal }
        );
        if (!resp.ok) throw new Error('search failed');
        const data = await resp.json();
        const results = Array.isArray(data?.results) ? data.results : [];
        const normName = normalize(name);
        const match = results.find((r: any) => {
          const title = normalize(String(r?.title || ''));
          if (!title) return false;
          if (normName && title.includes(normName)) return true;
          if (tokens.length === 0) return false;
          const hits = tokens.filter((t) => title.includes(t)).length;
          if (tokens.length === 1) return hits === 1;
          if (tokens.length === 2) return hits === 2;
          return hits >= Math.ceil(tokens.length * 0.75);
        }) || null;
        const url = match ? (match.thumbnail || match.url || null) : null;
        if (cancelled) return;
        setDishImageSuggestion(url);
      } catch (err: any) {
        if (cancelled || err?.name === 'AbortError') return;
        setDishImageSuggestion(null);
      } finally {
        if (!cancelled) setDishImageSearching(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [dishName, isDishModalOpen, dishImageManual]);

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dishSaving) return;
    if (!dishName.trim()) { setDishError('Dish name is required.'); return; }
    if (!dishPrice || Number(dishPrice) <= 0) { setDishError('Price must be greater than 0.'); return; }
    if (!dishDescription.trim()) { setDishError('Description is required.'); return; }
    const discountPct = Math.min(99, Math.max(0, Number(dishDiscount) || 0));
    const offerActive = dishOfferActive && discountPct > 0;
    if (dishOfferActive && discountPct <= 0) { setDishError('Set a discount percentage greater than 0 to activate an offer.'); return; }
    if (dishOfferStart && dishOfferEnd && dishOfferEnd < dishOfferStart) { setDishError('Offer end date cannot be before start date.'); return; }
    setDishError(null);
    setDishSuccess(null);

    let syncedCategories = syncedModalCategories;
    if (syncedCategories.length === 0) {
      const freshCategories = await refreshSyncedCategories();
      const source = freshCategories.length ? freshCategories : (modalCategories.length ? modalCategories : categories);
      syncedCategories = source.filter((c) => isSyncedCategoryId(c.id));
    }
    if (syncedCategories.length === 0) {
      setDishError((prev) => prev || 'No synced categories available. Refresh categories and try again.');
      return;
    }
    const selectedCategoryObj = syncedCategories.find((c) => String(c.id) === String(dishCategoryId)) || syncedCategories[0];
    const categoryIdNum = Number(selectedCategoryObj.id);
    if (!Number.isFinite(categoryIdNum) || categoryIdNum <= 0) {
      setDishError('Category list is not synced. Please wait a moment and try again.');
      return;
    }
    setDishCategoryId(String(categoryIdNum));

    const existing = editingDishId ? menuItems.find((i) => i.id === editingDishId) : null;
    const payload: any = {
      name: dishName.trim(),
      category: selectedCategoryObj.slug,
      categoryId: categoryIdNum,
      description: dishDescription.trim(),
      price: Number(dishPrice),
      foodType: dishFoodType,
      image: dishImageFile ? '' : (dishImage || ''),
      imageFile: dishImageFile || undefined,
      imageSource: dishImageSource,
      isAvailable: editingDishId ? (existing?.isAvailable !== false) : true,
      isActive: dishIsActive,
      tags: dishTags,
      preparationTimeMins: Math.max(1, Number(dishPrepTime) || 15),
      spiciness: dishSpiciness,
      discountPercentage: discountPct,
      offerActive,
      offerStartDate: dishOfferStart || null,
      offerEndDate: dishOfferEnd || null,
    };

    setDishSaving(true);
    try {
      if (editingDishId) {
        await onUpdateMenuItem(editingDishId, payload);
        setDishSuccess('Dish updated successfully.');
      } else {
        const duplicate = menuItems.some(
          (item) =>
            item.name.trim().toLowerCase() === dishName.trim().toLowerCase() &&
            item.category === selectedCategoryObj.slug
        );
        if (duplicate) {
          setDishError('A dish with this name already exists in the selected category.');
          return;
        }
        await onAddMenuItem(payload);
        setDishSuccess('Dish added successfully.');
      }
      setTimeout(() => setIsDishModalOpen(false), 400);
    } catch (err: any) {
      setDishError(err?.message || (editingDishId ? 'Failed to update dish.' : 'Failed to add dish.'));
    } finally {
      setDishSaving(false);
    }
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tableSaving) return;
    const num = tableNumberInput.trim().toUpperCase();
    if (!num) { setTableError('Table number is required.'); return; }
    if (tables.some((t) => String(t.tableNumber || '').toUpperCase() === num)) {
      setTableError(`Table ${num} already exists.`);
      return;
    }
    setTableError(null);
    setTableSuccess(null);
    setTableSaving(true);
    try {
      await onAddTable({
        tableNumber: num,
        displayName: tableDisplayName.trim() || `Table ${num}`,
        capacity: Number(tableCapacity) || 4,
        section: tableSection,
      });
      setTableSuccess(`Table ${num} created successfully.`);
      setTableNumberInput('');
      setTableDisplayName('');
      setTableCapacity(4);
      setTableSection('Ground Floor');
      setTimeout(() => setIsTableModalOpen(false), 500);
    } catch (err: any) {
      setTableError(err?.message || 'Failed to create table.');
    } finally {
      setTableSaving(false);
    }
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Restaurant Orders</h3>
                <p className="text-xs text-stone-500">
                  Active orders are still being processed. Order History shows successfully delivered/completed orders (final status <span className="font-semibold">completed</span> per kitchen workflow).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrdersView('active')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${ordersView === 'active' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
                >
                  Active Orders ({orders.filter((o) => !(o.status === 'completed' || o.status === 'served')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersView('history')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${ordersView === 'history' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
                >
                  Order History ({orders.filter((o) => o.status === 'completed' || o.status === 'served').length})
                </button>
              </div>
            </div>

            {deleteMessage && (
              <div className={`p-3 rounded-lg text-xs border ${/success/i.test(deleteMessage) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                {deleteMessage}
              </div>
            )}

            {(() => {
              const isDelivered = (status: OrderStatus) => status === 'completed' || status === 'served';
              const activeOrders = orders.filter((o) => !isDelivered(o.status));
              const historyBase = orders.filter((o) => isDelivered(o.status));
              const q = historySearch.trim().toLowerCase();
              const historyOrders = historyBase.filter((o) => {
                if (q) {
                  const hay = [
                    o.orderNumber,
                    String(o.id || ''),
                    o.customerName,
                    o.tableNumber,
                    o.status,
                    ...(o.items || []).map((it) => `${it.quantity}x ${it.name}`),
                  ].join(' ').toLowerCase();
                  if (!hay.includes(q)) return false;
                }
                const ref = o.updatedAt || o.createdAt;
                const d = ref ? String(ref).slice(0, 10) : '';
                if (historyDateFrom && d < historyDateFrom) return false;
                if (historyDateTo && d > historyDateTo) return false;
                return true;
              });
              const displayOrders = ordersView === 'history' ? historyOrders : activeOrders;

              return (
                <>
                  {ordersView === 'history' && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:flex-wrap border border-stone-200 rounded-xl p-3 bg-stone-50/70">
                      <div className="flex-1 min-w-[180px]">
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">Search history</label>
                        <input
                          type="text"
                          value={historySearch}
                          onChange={(e) => setHistorySearch(e.target.value)}
                          placeholder="Order ID/number, customer, table, item..."
                          className="w-full text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">From date</label>
                        <input
                          type="date"
                          value={historyDateFrom}
                          onChange={(e) => setHistoryDateFrom(e.target.value)}
                          className="text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-600 mb-1">To date</label>
                        <input
                          type="date"
                          value={historyDateTo}
                          onChange={(e) => setHistoryDateTo(e.target.value)}
                          className="text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 bg-white"
                        />
                      </div>
                      {(historySearch || historyDateFrom || historyDateTo) && (
                        <button
                          type="button"
                          onClick={() => { setHistorySearch(''); setHistoryDateFrom(''); setHistoryDateTo(''); }}
                          className="px-3 py-2 rounded-lg text-xs font-semibold border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                        >
                          Clear
                        </button>
                      )}
                      <div className="text-[11px] text-stone-500 sm:ml-auto">
                        Showing {historyOrders.length} of {historyBase.length} delivered/completed
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                          <th className="pb-3">Order # / ID</th>
                          <th className="pb-3">Table</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Ordered Items</th>
                          <th className="pb-3">Notes</th>
                          <th className="pb-3">Total</th>
                          <th className="pb-3">Date / Time</th>
                          <th className="pb-3">Final Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {displayOrders.map((order) => {
                          const delivered = isDelivered(order.status);
                          const dt = delivered ? (order.updatedAt || order.createdAt) : (order.createdAt || order.updatedAt);
                          return (
                            <tr key={order.id} className="hover:bg-stone-50">
                              <td className="py-3 font-mono font-bold text-stone-900">
                                <div>{order.orderNumber}</div>
                                <div className="text-[10px] font-normal text-stone-400">ID: {order.id}</div>
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
                              <td className="py-3 text-stone-700 whitespace-nowrap">
                                {dt ? new Date(dt).toLocaleString() : '—'}
                              </td>
                              <td className="py-3">
                                {delivered ? (
                                  <span className="text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                                    {order.status === 'completed' ? 'Delivered / Completed' : order.status}
                                  </span>
                                ) : (
                                  <select
                                    value={order.status}
                                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                    className="bg-stone-100 border border-stone-200 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:border-amber-600"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Delivered / Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                  </select>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  <button
                                    onClick={() => onOpenQRModalForTable(order.tableNumber)}
                                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
                                  >
                                    Table QR
                                  </button>
                                  {!delivered && order.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelOrder(order.id)}
                                      className="text-xs text-red-600 hover:text-red-700 font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {displayOrders.length === 0 && (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-stone-500 text-sm">
                              {ordersView === 'history'
                                ? (historyBase.length === 0 ? 'No delivered/completed orders yet.' : 'No orders match the current search/date filters.')
                                : 'No active orders. Delivered/completed orders appear in Order History.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
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

            {deleteMessage && (
              <div className={`p-3 rounded-lg text-xs border ${/fail|cannot|error/i.test(deleteMessage) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {deleteMessage}
              </div>
            )}

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
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setDeleteMessage(null);
                          await onToggleAvailability(item.id);
                          setDeleteMessage('Dish stock status updated.');
                        } catch (err: any) {
                          setDeleteMessage(err?.message || 'Failed to update stock status.');
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        item.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-stone-100 text-stone-500 border border-stone-200'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setDeleteMessage(null);
                          await onUpdateMenuItem(item.id, { isActive: item.isActive === false ? true : false });
                          setDeleteMessage('Dish active status updated.');
                        } catch (err: any) {
                          setDeleteMessage(err?.message || 'Failed to update active status.');
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                        item.isActive !== false
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {item.isActive !== false ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          setDeleteMessage(null);
                          await onUpdateMenuItem(item.id, { isSpecial: !item.isSpecial });
                          setDeleteMessage('Dish special status updated.');
                        } catch (err: any) {
                          setDeleteMessage(err?.message || 'Failed to update special status.');
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                        item.isSpecial
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}
                    >
                      {item.isSpecial ? 'Special' : 'Mark Special'}
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
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete "${item.name}"? This will remove it from the menu.`)) return;
                          try {
                            setDeleteMessage(null);
                            await onDeleteMenuItem(item.id);
                            setDeleteMessage('Dish deleted successfully.');
                          } catch (err: any) {
                            setDeleteMessage(err?.message || 'Failed to delete dish.');
                          }
                        }}
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
                onClick={() => { setTableError(null); setTableSuccess(null); setIsTableModalOpen(true); }}
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Restaurant Table</span>
              </button>
            </div>

            {tableSuccess && (
              <div className="p-3 rounded-lg text-xs border bg-emerald-50 text-emerald-700 border-emerald-200">
                {tableSuccess}
              </div>
            )}
            {tableError && !isTableModalOpen && (
              <div className="p-3 rounded-lg text-xs border bg-red-50 text-red-700 border-red-200">
                {tableError}
              </div>
            )}

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
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 relative max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-stone-200 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-stone-900 font-serif leading-tight">
                  {editingDishId ? 'Edit Dish' : 'Add New Dish'}
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  {editingDishId ? 'Update dish details and availability.' : 'Add a new dish to the BhojanQR menu.'}
                </p>
              </div>
              <button
                onClick={() => setIsDishModalOpen(false)}
                className="p-1.5 -mr-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="flex flex-col min-h-0 flex-1">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {dishError && (
                  <div className="rounded-lg bg-red-50 text-red-700 text-sm border border-red-200 px-3 py-2.5">
                    {dishError}
                  </div>
                )}
                {dishSuccess && (
                  <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200 px-3 py-2.5">
                    {dishSuccess}
                  </div>
                )}

                <section className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Dish Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Dish Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={dishName}
                        onChange={(e) => setDishName(e.target.value)}
                        placeholder="e.g. Kashmiri Rogan Josh"
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                      <select
                        value={dishCategoryId}
                        onChange={(e) => setDishCategoryId(e.target.value)}
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                        required
                        disabled={categoriesSyncing}
                      >
                        {syncedModalCategories.length === 0 && (
                          <option value="">{categoriesSyncing ? 'Syncing categories…' : 'No synced categories available'}</option>
                        )}
                        {syncedModalCategories.map((cat) => (
                          <option key={cat.id} value={String(cat.id)}>{cat.name}</option>
                        ))}
                      </select>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p className={`text-xs ${categoriesSyncing ? 'text-stone-500' : categoriesSynced ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {categoriesSyncing ? 'Syncing categories from server…' : categoriesSynced ? 'Categories synced from server.' : 'Categories not synced yet.'}
                        </p>
                        <button type="button" onClick={() => void refreshSyncedCategories()} className="text-xs font-semibold text-amber-700 hover:text-amber-800">
                          Refresh
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Food Type <span className="text-red-500">*</span></label>
                      <select
                        value={dishFoodType}
                        onChange={(e) => setDishFoodType(e.target.value as FoodType)}
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                      >
                        <option value="veg">Pure Veg</option>
                        <option value="non-veg">Non-Veg</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={dishPrice}
                        onChange={(e) => setDishPrice(Number(e.target.value))}
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Preparation Time (minutes) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={dishPrepTime}
                        onChange={(e) => setDishPrepTime(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Culinary Description <span className="text-red-500">*</span></label>
                      <textarea
                        rows={3}
                        required
                        value={dishDescription}
                        onChange={(e) => setDishDescription(e.target.value)}
                        placeholder="Ingredients, marinade, preparation style..."
                        className="w-full text-sm px-3 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">Active Status</label>
                      <button
                        type="button"
                        onClick={() => setDishIsActive((v) => !v)}
                        className={`h-10 px-4 rounded-lg text-sm font-semibold border transition-colors ${dishIsActive ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'}`}
                      >
                        {dishIsActive ? 'Active' : 'Inactive'}
                      </button>
                      <p className="text-xs text-stone-500 mt-1.5">Inactive dishes are hidden from the customer menu.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Dish Image</h4>
                    {dishImageSearching && <span className="text-xs text-amber-700">Finding matching image…</span>}
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                    <div className="flex items-start gap-4">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg border border-stone-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                        {dishImage || dishImageFile ? (
                          <img src={dishImageFile ? URL.createObjectURL(dishImageFile) : dishImage} alt={dishName || 'Dish preview'} className="w-full h-full object-cover" />
                        ) : (
                          <div className="px-3 text-center">
                            <div className="text-stone-400 text-xs font-medium">No image selected</div>
                            <div className="text-stone-400 text-[11px] mt-1">Select a suggestion, preset, URL, or upload a file</div>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-800">
                          {dishImageFile ? 'Selected uploaded image' : dishImage ? 'Selected image' : 'No image selected'}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          Source: <span className="font-semibold text-stone-700">{dishImageSource}</span>
                          {dishImageFile ? ` (${dishImageFile.name})` : dishImage ? ` (${dishImage.startsWith('data:') ? 'data URL' : dishImage})` : ''}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          Suggestions are not auto-applied. Confirm a suggestion, choose a preset, paste an image URL, or upload a file.
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(dishImage || dishImageFile) && (
                            <button
                              type="button"
                              onClick={() => { setDishImageManual(true); setDishImage(''); setDishImageFile(null); setDishImageSource('none'); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                            >
                              Remove image
                            </button>
                          )}
                          {dishImageManual && (
                            <button
                              type="button"
                              onClick={() => { setDishImageManual(false); setDishImage(''); setDishImageFile(null); setDishImageSource('none'); setDishImageSuggestion(null); }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                            >
                              Find suggestion for name
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Image URL (manual)</label>
                      <input
                        type="url"
                        value={dishImageFile ? '' : dishImage}
                        onChange={(e) => { setDishImageManual(true); setDishImage(e.target.value); setDishImageFile(null); setDishImageSource(e.target.value.trim() ? 'url' : 'none'); }}
                        placeholder="https://example.com/dish.jpg"
                        className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">Upload image file</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setDishImageManual(true);
                          setDishImageFile(file);
                          if (file) { setDishImage(''); setDishImageSource('upload'); }
                          else if (!dishImage) { setDishImageSource('none'); }
                        }}
                        className="w-full text-sm"
                      />
                      <p className="text-[11px] text-stone-500 mt-1">Uploaded file is sent to backend if supported; URL can be used instead.</p>
                    </div>
                  </div>

                  {!dishImageManual && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3">
                      <p className="text-xs font-semibold text-stone-700 mb-2">Suggested image (confirm to use)</p>
                      {dishImageSearching ? (
                        <div className="text-xs text-stone-500">Searching for a relevant image…</div>
                      ) : dishImageSuggestion ? (
                        <div className="flex items-center gap-3">
                          <img src={dishImageSuggestion} alt={`Suggested for ${dishName || 'dish'}`} className="w-20 h-20 rounded-lg object-cover border border-stone-200 bg-white" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-stone-600">Suggested match for “{dishName.trim()}”. Confirm only if it correctly shows this dish.</p>
                            <button
                              type="button"
                              onClick={() => { setDishImage(dishImageSuggestion); setDishImageManual(true); setDishImageFile(null); setDishImageSource('suggestion'); }}
                              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              Use this suggestion
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-stone-500">
                          {dishName.trim().length < 2
                            ? 'Type a dish name to see a relevant suggestion.'
                            : 'No confident match found for this dish name. Enter an image URL, upload an image, or choose a preset.'}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-stone-600 mb-2">Preset images (optional)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Biryani', src: BIRYANI_IMAGE },
                        { label: 'Tandoor', src: PANEER_IMAGE },
                        { label: 'Dessert', src: DESSERT_IMAGE },
                        { label: 'Feast', src: HERO_IMAGE },
                      ].map((p) => {
                        const selected = !dishImageFile && dishImage === p.src;
                        return (
                          <button
                            type="button"
                            key={p.label}
                            onClick={() => { setDishImageManual(true); setDishImage(p.src); setDishImageFile(null); setDishImageSource('preset'); }}
                            className={`group relative rounded-xl border-2 p-2 text-center transition-all ${selected ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-200' : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'}`}
                          >
                            <img src={p.src} alt={p.label} className="w-full h-20 object-cover rounded-lg" />
                            <span className="text-xs font-medium text-stone-700 block mt-2">{p.label}</span>
                            {selected && (
                              <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600 text-white shadow-sm">
                                <Check className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>

                <section className="border border-stone-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDishAdvancedOpen((o) => !o)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors text-left"
                    aria-expanded={dishAdvancedOpen}
                  >
                    <div>
                      <div className="text-sm font-semibold text-stone-900">Advanced Options</div>
                      <div className="text-xs text-stone-500">Discounts, offers, and product tags (optional)</div>
                    </div>
                    <span className="text-stone-500">{dishAdvancedOpen ? '−' : '+'}</span>
                  </button>

                  {dishAdvancedOpen && (
                    <div className="p-4 space-y-5 bg-white border-t border-stone-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1.5">Discount (%)</label>
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={dishDiscount}
                            onChange={(e) => {
                              const v = Math.min(99, Math.max(0, Number(e.target.value) || 0));
                              setDishDiscount(v);
                              if (v <= 0) setDishOfferActive(false);
                            }}
                            className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                          />
                          <p className="text-xs text-stone-500 mt-1">Default 0. Set above 0 to enable offers.</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1.5">Offer Activation</label>
                          <button
                            type="button"
                            onClick={() => setDishOfferActive((v) => !v)}
                            disabled={dishDiscount <= 0}
                            className={`h-10 px-4 rounded-lg text-sm font-semibold border transition-colors ${dishOfferActive && dishDiscount > 0 ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' : 'bg-white text-stone-600 border-stone-300 hover:bg-stone-50'} ${dishDiscount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {dishOfferActive && dishDiscount > 0 ? 'Offer Enabled' : 'Offer Disabled'}
                          </button>
                        </div>
                      </div>

                      {dishOfferActive && dishDiscount > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Offer Start Date</label>
                            <input
                              type="date"
                              value={dishOfferStart}
                              onChange={(e) => setDishOfferStart(e.target.value)}
                              className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Offer Expiry Date</label>
                            <input
                              type="date"
                              value={dishOfferEnd}
                              onChange={(e) => setDishOfferEnd(e.target.value)}
                              min={dishOfferStart || undefined}
                              className="w-full h-10 text-sm px-3 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                            />
                          </div>
                          <p className="sm:col-span-2 text-xs text-amber-800 font-medium">
                            Discounted price: {formatINR(Math.round(Number(dishPrice || 0) * (100 - dishDiscount)) / 100)} (save {dishDiscount}%)
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Product Tags <span className="text-stone-400 font-normal">(optional)</span></label>
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
                              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${dishTags.includes(tag) ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-stone-600 border-stone-300 hover:border-amber-400 hover:text-stone-800'}`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50/80 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDishModalOpen(false)}
                  disabled={dishSaving}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-200/70 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dishSaving}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {dishSaving ? 'Saving...' : (editingDishId ? 'Save Changes' : 'Add Dish')}
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
              <div>
                <h3 className="text-base font-bold text-stone-900">Menu Categories</h3>
                <p className="text-xs text-stone-500 mt-1">
                  Counts show total non-deleted dishes assigned in each category (from PostgreSQL).
                </p>
              </div>
            </div>

            {categoryMessage && (
              <div className={`p-3 rounded-lg text-xs border ${/fail|cannot|error|reassign|must/i.test(categoryMessage) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                {categoryMessage}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const name = (editingCategoryId ? editingCategoryName : newCategoryName).trim();
                if (!name || categoryBusy) return;
                setCategoryBusy(true);
                setCategoryMessage(null);
                try {
                  if (editingCategoryId) {
                    await onUpdateCategory(editingCategoryId, name);
                    setCategoryMessage('Category updated successfully.');
                    setEditingCategoryId(null);
                    setEditingCategoryName('');
                    setNewCategoryName('');
                  } else {
                    await onAddCategory(name);
                    setCategoryMessage('Category added successfully.');
                    setNewCategoryName('');
                  }
                } catch (err: any) {
                  setCategoryMessage(err?.response?.data?.detail || err?.message || (editingCategoryId ? 'Failed to update category.' : 'Failed to add category.'));
                } finally {
                  setCategoryBusy(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                value={editingCategoryId ? editingCategoryName : newCategoryName}
                onChange={(e) => editingCategoryId ? setEditingCategoryName(e.target.value) : setNewCategoryName(e.target.value)}
                placeholder={editingCategoryId ? 'Edit category name' : 'Category name'}
                className="flex-1 text-xs px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
                disabled={categoryBusy}
              />
              <button type="submit" disabled={categoryBusy} className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg disabled:opacity-60">
                {categoryBusy ? 'Saving...' : (editingCategoryId ? 'Update' : 'Add')}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  disabled={categoryBusy}
                  onClick={() => { setEditingCategoryId(null); setEditingCategoryName(''); setCategoryMessage(null); }}
                  className="px-3 py-2 bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200"
                >
                  Cancel
                </button>
              )}
            </form>

            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between border border-stone-200 rounded-lg p-3">
                  <div>
                    <span className="font-semibold text-stone-900">{cat.name}</span>
                    <span className="text-xs text-stone-500 ml-2">({cat.itemCount ?? 0} {(cat.itemCount ?? 0) === 1 ? 'dish' : 'dishes'})</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={categoryBusy}
                      onClick={() => {
                        setCategoryMessage(null);
                        setEditingCategoryId(cat.id);
                        setEditingCategoryName(cat.name);
                        setNewCategoryName('');
                      }}
                      className="text-xs text-amber-700 font-semibold disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      disabled={categoryBusy}
                      onClick={async () => {
                        const count = cat.itemCount ?? 0;
                        if (count > 0) {
                          setCategoryMessage(`Cannot delete category "${cat.name}" because it has ${count} ${count === 1 ? 'dish' : 'dishes'} assigned. Reassign or remove its dishes first.`);
                          return;
                        }
                        if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
                        setCategoryBusy(true);
                        setCategoryMessage(null);
                        try {
                          await onDeleteCategory(cat.id);
                          setCategoryMessage('Category deleted successfully.');
                          if (editingCategoryId === cat.id) { setEditingCategoryId(null); setEditingCategoryName(''); }
                        } catch (err: any) {
                          setCategoryMessage(err?.response?.data?.detail || err?.message || 'Failed to delete category.');
                        } finally {
                          setCategoryBusy(false);
                        }
                      }}
                      className="text-xs text-red-600 font-semibold disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-sm text-stone-500 py-4">No categories found.</div>
              )}
            </div>
          </div>
        )}

        {/* TABLE CREATE MODAL */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 relative my-4">
            <button
              type="button"
              onClick={() => { if (!tableSaving) { setIsTableModalOpen(false); setTableError(null); } }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-stone-900 mb-4 font-serif">
              Add Restaurant Dining Table
            </h3>

            <form onSubmit={handleSaveTable} className="space-y-3.5">
              {tableError && (
                <div className="rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 px-3 py-2.5">
                  {tableError}
                </div>
              )}
              {tableSuccess && (
                <div className="rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-200 px-3 py-2.5">
                  {tableSuccess}
                </div>
              )}
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
                  onClick={() => { if (!tableSaving) { setIsTableModalOpen(false); setTableError(null); } }}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
                  disabled={tableSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={tableSaving}
                >
                  {tableSaving ? 'Creating...' : 'Create Table & Generate QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
