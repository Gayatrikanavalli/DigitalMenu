import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  MenuItem, 
  Category, 
  RestaurantTable, 
  Order, 
  CartItem, 
  ActiveView, 
  FoodType, 
  OrderStatus,
  AuthState,
  StaffUser,
  LoginIntended,
} from './types';
import { 
  getCategories, 
  getMenuItems, 
  getTables, 
  getOrders, 
  getActiveTable, 
  setActiveTable, 
  subscribeToStore, 
  saveOrders,
  saveMenuItems,
  saveCategories,
  saveTables,
  formatINR,
  resetDemoData,
  toggleMenuItemAvailability,
  clearCachedData,
} from './lib/storage';
import { api } from './lib/api';
import { auth } from './lib/auth';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ShopPage } from './components/ShopPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { KitchenDashboard } from './components/KitchenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TableQRModal } from './components/TableQRModal';
import { Footer } from './components/Footer';
import { LoginForm } from './components/LoginForm';
import { FoodAssistant } from './components/FoodAssistant';
import { Heart, ArrowRight } from 'lucide-react';
import { MyOrdersPage } from './components/MyOrdersPage';
import { OffersPage } from './components/OffersPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';

const ROUTES = {
  customer: '/',
  menu: '/menu',
  offers: '/offers',
  about: '/about',
  contact: '/contact',
  orders: '/my-orders',
  admin: '/admin',
  kitchen: '/kitchen',
} as const;

function getCurrentPath(): string {
  const p = typeof window !== 'undefined' ? window.location.pathname : '/';
  return p;
}

function pathToView(path: string): ActiveView {
  if (path === '/admin' || path.startsWith('/admin')) return 'admin';
  if (path === '/kitchen' || path.startsWith('/kitchen')) return 'kitchen';
  return 'customer';
}

export default function App() {
  const [path, setPath] = useState<string>(getCurrentPath());
  const activeView: ActiveView = pathToView(path);

  // Shared data
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [menuItems, setMenuItems] = useState<MenuItem[]>(getMenuItems());
  const [tables, setTables] = useState<RestaurantTable[]>(getTables());
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTableNum, setActiveTableNum] = useState<string>(getActiveTable());

  // Auth state
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [staffError, setStaffError] = useState('');
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<Set<string>>(new Set());
  const menuRefreshSeq = useRef(0);

  const refreshMenuAndCategories = async (seq?: number) => {
    const mySeq = seq ?? ++menuRefreshSeq.current;
    try {
      const [items, cats] = await Promise.all([
        api.menu.list({ include_inactive: true, strict: true }),
        api.categories.list({ strict: true }),
      ]);
      if (mySeq !== menuRefreshSeq.current) return;
      setMenuItems(items);
      saveMenuItems(items);
      setCategories(cats);
      saveCategories(cats);
    } catch (err) {
      console.warn('Failed to refresh menu/categories from server', err);
    }
  };

  // Demo mode flag
  const demoMode =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEMO_MODE === 'true') ||
    (import.meta as any).env?.VITE_DEMO_MODE === 'true';

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('bhojan_wishlist') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bhojan_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const wishlistItems = useMemo(
    () => menuItems.filter((m) => wishlist.includes(m.id)),
    [menuItems, wishlist]
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState<boolean>(false);
  const [menuCategory, setMenuCategory] = useState<string>('all');

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Location modal
  const [isLocationOpen, setIsLocationOpen] = useState<boolean>(false);

  // Customer order tracking
  const [trackOrderNumber, setTrackOrderNumber] = useState<string>('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState<string>('');

  const isAuthenticated = authState?.is_authenticated || false;
  const user: StaffUser | null = authState?.user ?? null;
  const isManager = authState?.is_manager || false;
  const isKitchenStaff = authState?.is_kitchen_staff || false;

  const isStaffView = activeView === 'admin' || activeView === 'kitchen';
  const requiresManager = activeView === 'admin';
  const requiresKitchen = activeView === 'kitchen';

  // Navigation
  const navigate = useCallback((view: string, category?: string) => {
    const path = view.startsWith('/') ? view : '/' + view;
    if (path === ROUTES.menu && category) {
      setMenuCategory(category);
    } else if (path === ROUTES.menu) {
      setMenuCategory('all');
    }
    console.log('[TRACE] navigate ->', path, 'from', window.location.pathname);
    window.history.pushState({}, '', path);
    setPath(path);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch {
      // ignore logout errors; clear local state regardless
    }
    setAuthState(null);
    setAuthChecked(true);
    clearCachedData();
    setOrders([]);
    saveOrders([]);
    setConfirmedOrder(null);
    setStaffError('');
    setPath(ROUTES.customer);
    window.history.replaceState({}, '', ROUTES.customer);
    setLoginError('');
  };

  const handleLogin = async (username: string, password: string) => {
    setLoginError('');
    setStaffError('');
    try {
      await auth.login(username, password);
      await refreshAuth();
      if (activeView === 'kitchen' || (isKitchenStaff && !isManager)) {
        navigate('/kitchen');
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.error || 'Invalid username or password.');
    }
  };

  const refreshAuth = useCallback(async () => {
    try {
      const state = await auth.me();
      setAuthState(state);
    } catch {
      setAuthState({ is_authenticated: false, user: null, is_manager: false, is_kitchen_staff: false });
    }
  }, []);

  useEffect(() => {
    if (authState?.is_authenticated) {
      setWasAuthenticated(true);
    }
  }, [authState?.is_authenticated]);

  // Subscribe to storage updates
  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      setCategories(getCategories());
      setMenuItems(getMenuItems());
      setTables(getTables());
      const updatedOrders = getOrders();
      if (!isStaffView || isAuthenticated) {
        setOrders(updatedOrders);
      }
      if (confirmedOrder) {
        const found = updatedOrders.find((o) => o.id === confirmedOrder.id);
        if (found) setConfirmedOrder(found);
      }
    });
    return () => unsubscribe();
  }, [confirmedOrder]);

  // Sync shared menu data from Django
  useEffect(() => {
    let mounted = true;
    const loadShared = async () => {
      try {
        const cats = await api.categories.list({ strict: true });
        if (mounted) { setCategories(cats); saveCategories(cats); }
      } catch {}
      try {
        const items = await api.menu.list({ include_inactive: true });
        if (mounted) { setMenuItems(items); saveMenuItems(items); }
      } catch {}
      try {
        const tbls = await api.tables.list();
        if (tbls.length && mounted) { setTables(tbls); saveTables(tbls); }
      } catch {}
    };
    void loadShared();
    return () => { mounted = false; };
  }, []);

  // Read URL table param on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get('table');
    if (tableParam) {
      const formatted = tableParam.toUpperCase();
      setActiveTable(formatted);
      setActiveTableNum(formatted);
    }
  }, []);

  // Initialize auth on mount; handle popstate routing
  useEffect(() => {
    let mounted = true;
    (async () => {
      await refreshAuth();
      if (mounted) setAuthChecked(true);
    })();

    const onPop = () => {
      setPath(getCurrentPath());
      setLoginError('');
    };
    window.addEventListener('popstate', onPop);

    const onSessionExpired = () => {
      console.log('[TRACE] onSessionExpired fired, wasAuthenticated=', wasAuthenticated);
      setAuthState({ is_authenticated: false, user: null, is_manager: false, is_kitchen_staff: false });
      setAuthChecked(true);
      clearCachedData();
      setLoginError('');
      if (wasAuthenticated) {
        setPath(ROUTES.customer);
        window.history.replaceState({}, '', ROUTES.customer);
      }
    };
    window.addEventListener('auth:session-expired', onSessionExpired);

    return () => {
      mounted = false;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, [refreshAuth]);

  // Load staff-only order data
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    let mounted = true;
    const loadStaffOrders = async () => {
      try {
        if (activeView === 'admin') {
          const staffOrders = await api.orders.list();
          if (mounted) { setOrders(staffOrders); saveOrders(staffOrders); }
        } else if (activeView === 'kitchen') {
          const feed = await api.orders.kitchenFeed();
          if (mounted) { setOrders(feed); saveOrders(feed); }
        }
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 403) setStaffError('You do not have permission to view these orders.');
        setOrders([]);
        saveOrders([]);
      }
    };
    void loadStaffOrders();
    const refreshInterval = window.setInterval(() => {
      if (mounted) void loadStaffOrders();
    }, 15000);
    return () => { mounted = false; window.clearInterval(refreshInterval); };
  }, [activeView, authChecked, isAuthenticated]);

  // Reset category drawer when navigating away from menu page
  useEffect(() => {
    if (path !== ROUTES.menu) {
      setCategoryDrawerOpen(false);
    }
  }, [path]);

  // Reset orders when not authenticated
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      setOrders([]);
      saveOrders([]);
    }
  }, [authChecked, isAuthenticated]);

  const staffOrders = useMemo(() => {
    if (!isAuthenticated || !isStaffView) return [];
    return orders;
  }, [orders, isAuthenticated, isStaffView]);

  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.menuItem.price * i.quantity, 0), [cart]);

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    setCart((prev) => {
      if (newQty <= 0) return prev.filter((ci) => ci.menuItem.id !== itemId);
      return prev.map((ci) =>
        ci.menuItem.id === itemId ? { ...ci, quantity: newQty } : ci
      );
    });
  };

  const handleClearCart = () => setCart([]);

  const handleSelectTable = (tableNum: string) => {
    setActiveTable(tableNum);
    setActiveTableNum(tableNum);
  };

  const handlePlaceOrder = async (orderData: {
    customerName: string;
    customerPhone: string;
    specialInstructions: string;
  }) => {
    const newOrder = await api.orders.create({
      tableNumber: activeTableNum,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      specialInstructions: orderData.specialInstructions,
      cartItems: cart,
    });
    setCart([]);
    setConfirmedOrder(newOrder);
    return newOrder;
  };

  const handleTrackOrder = async () => {
    if (!trackOrderNumber.trim()) return;
    setTrackError('');
    setTrackedOrder(null);
    try {
      const o = await api.orders.track(trackOrderNumber.trim());
      setTrackedOrder(o);
    } catch {
      setTrackError('No order found with that number.');
      setTrackedOrder(null);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    await api.orders.cancelOrder(orderId);
    if (activeView === 'admin') {
      try {
        const staffOrders = await api.orders.list();
        if (staffOrders.length) { setOrders(staffOrders); saveOrders(staffOrders); }
      } catch {}
    }
  };

  const loginIntended: LoginIntended = activeView === 'kitchen' ? 'kitchen' : 'admin';

  // Staff views - login if not authenticated
  if (isStaffView) {
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-[#fafafb] flex items-center justify-center p-4 text-stone-900">
          <LoginForm
            intended={loginIntended}
            onLogin={handleLogin}
            onReturnToCustomer={() => navigate('/')}
            error={loginError}
            demoMode={demoMode}
          />
        </div>
      );
    }
    if (requiresManager && !isManager) {
      navigate('/kitchen');
      return null;
    }
    if (requiresKitchen && !isKitchenStaff && !isManager) {
      navigate('/');
      return null;
    }
  }

  // Customer view loading state
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#fafafb] flex items-center justify-center text-stone-600">
        <div className="text-xs font-medium">Loading BhojanQR&hellip;</div>
      </div>
    );
  }

  return (
      <AnimatePresence>
      <motion.div
        key={path}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-white text-stone-900 flex flex-col font-sans"
      >
      
      {/* Header */}
      {!(path === '/menu' && activeView === 'customer') && (
        <Header
          activeView={activeView}
          currentPath={path}
          isAuthenticated={isAuthenticated}
          user={user}
          isManager={isManager}
          isKitchenStaff={isKitchenStaff}
          onNavigate={navigate}
          onLogin={handleLogin}
          onLogout={handleLogout}
          activeTable={activeTableNum}
          cartCount={cartCount}
          cartTotal={cartTotal}
          onOpenCart={() => setIsCartOpen(true)}
          wishlistCount={wishlist.length}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenLocation={() => setIsLocationOpen(true)}
          onOpenCategoryDrawer={() => setCategoryDrawerOpen(true)}
        />
      )}

      {/* Customer Pages */}
          {activeView === 'customer' && (
            <>
              {path === '/' || path === ROUTES.customer || path === '/customer' ? (
                <HomePage
                  categories={categories}
                  menuItems={menuItems}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                  onNavigate={navigate}
                  activeTable={activeTableNum}
                  onOpenTableModal={() => setIsTableModalOpen(true)}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
              ) : path === ROUTES.menu ? (
                <ShopPage
                  categories={categories}
                  menuItems={menuItems}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                  onNavigate={navigate}
                  activeTable={activeTableNum}
                  onOpenTableModal={() => setIsTableModalOpen(true)}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                  cartCount={cartCount}
                  cartTotal={cartTotal}
                  initialDrawerOpen={categoryDrawerOpen}
                  initialCategory={menuCategory}
                />
              ) : path.startsWith('/menu/') ? (
                <ProductDetailsPage
                  productId={path.replace('/menu/', '').split('/')[0]}
                  menuItems={menuItems}
                  categories={categories}
                  cart={cart}
                  wishlist={wishlist}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                  onNavigate={navigate}
                />
              ) : path === ROUTES.offers ? (
                <OffersPage
                  menuItems={menuItems}
                  cart={cart}
                  categories={categories}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                  onNavigate={navigate}
                  activeTable={activeTableNum}
                  onOpenTableModal={() => setIsTableModalOpen(true)}
                  onOpenCart={() => setIsCartOpen(true)}
                />
              ) : path === ROUTES.orders ? (
                <MyOrdersPage menuItems={menuItems} onNavigate={navigate} />
              ) : path === ROUTES.about ? (
                <AboutPage onNavigate={navigate} />
              ) : path === ROUTES.contact ? (
                <ContactPage
                  activeTable={activeTableNum}
                  onOpenTableModal={() => setIsTableModalOpen(true)}
                  onOpenLocation={() => setIsLocationOpen(true)}
                />
              ) : (
                <HomePage
                  categories={categories}
                  menuItems={menuItems}
                  cart={cart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToggleWishlist={toggleWishlist}
                  wishlist={wishlist}
                  onNavigate={navigate}
                  activeTable={activeTableNum}
                  onOpenTableModal={() => setIsTableModalOpen(true)}
                  onOpenCart={() => setIsCartOpen(true)}
                  onOpenWishlist={() => setIsWishlistOpen(true)}
                />
              )}
            </>
          )}

      {/* Kitchen Display */}
      {activeView === 'kitchen' && isAuthenticated && (
        <>
          {staffError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 mx-4 mb-4">
              {staffError}
            </div>
          )}
          <KitchenDashboard
            isAuthenticated={isAuthenticated}
            orders={staffOrders}
            user={user}
            statusUpdating={statusUpdating}
            onLogout={handleLogout}
            onUpdateStatus={async (orderId, status) => {
              setStatusUpdating((prev) => new Set(prev).add(orderId));
              try {
                await api.orders.updateStatus(orderId, status);
                if (activeView === 'kitchen') {
                  const feed = await api.orders.kitchenFeed();
                  setOrders(feed);
                  saveOrders(feed);
                }
              } catch (err: any) {
                const statusCode = err?.response?.status;
                if (statusCode === 403) setStaffError('You do not have permission to update this order.');
                else setStaffError('Failed to update order status. Please try again.');
              } finally {
                setStatusUpdating((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
              }
            }}
          />
        </>
      )}

      {/* Admin Portal */}
      {activeView === 'admin' && isAuthenticated && (
        <>
          {staffError && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200 mx-4 mb-4">
              {staffError}
            </div>
          )}
          <AdminDashboard
            isAuthenticated={isAuthenticated}
            user={user}
            isManager={isManager}
            onLogout={handleLogout}
            menuItems={menuItems}
            categories={categories}
            tables={tables}
            orders={staffOrders}
            onAddMenuItem={async (item) => {
              const cat = categories.find((c) => c.slug === item.category || c.id === item.category);
              const created = await api.menu.create(
                item,
                cat ? { id: cat.id, slug: cat.slug } : undefined
              );
              setMenuItems((prev) => {
                const next = [created, ...prev.filter((m) => String(m.id) !== String(created.id))];
                saveMenuItems(next);
                return next;
              });
              await refreshMenuAndCategories(++menuRefreshSeq.current);
              window.setTimeout(() => { void refreshMenuAndCategories(++menuRefreshSeq.current); }, 1200);
            }}
            onUpdateMenuItem={async (id, updates) => {
              await api.menu.update(id, updates);
              setMenuItems((prev) => {
                const next = prev.map((m) => (String(m.id) === String(id) ? { ...m, ...updates } : m));
                saveMenuItems(next);
                return next;
              });
              await refreshMenuAndCategories(++menuRefreshSeq.current);
            }}
            onDeleteMenuItem={async (id) => {
              await api.menu.delete(id);
              setMenuItems((prev) => {
                const next = prev.filter((m) => String(m.id) !== String(id));
                saveMenuItems(next);
                return next;
              });
              await refreshMenuAndCategories(++menuRefreshSeq.current);
            }}
            onToggleAvailability={async (id) => {
              const current = menuItems.find((m) => m.id === id);
              const nextAvailable = !(current?.isAvailable ?? true);
              await api.menu.update(id, { isAvailable: nextAvailable });
              setMenuItems((prev) => {
                const next = prev.map((m) => (String(m.id) === String(id) ? { ...m, isAvailable: nextAvailable } : m));
                saveMenuItems(next);
                return next;
              });
              await refreshMenuAndCategories(++menuRefreshSeq.current);
            }}
            onAddTable={async (table) => {
              const created = await api.tables.create(table);
              setTables((prev) => {
                const next = [...prev.filter((t) => String(t.id) !== String(created.id) && t.tableNumber !== created.tableNumber), created]
                  .sort((a, b) => a.tableNumber.localeCompare(b.tableNumber));
                saveTables(next);
                return next;
              });
              try {
                const tbls = await api.tables.list();
                if (Array.isArray(tbls)) { setTables(tbls); saveTables(tbls); }
              } catch (err) {
                console.warn('Failed to refresh tables after create', err);
              }
              return created;
            }}
            onUpdateOrderStatus={async (orderId, status) => {
              setStatusUpdating((prev) => new Set(prev).add(orderId));
              try {
                await api.orders.updateStatus(orderId, status);
                const freshOrders = await api.orders.list();
                setOrders(freshOrders);
                saveOrders(freshOrders);
              } catch (err: any) {
                if (err?.response?.status === 403) setStaffError('You do not have permission to update this order.');
                else setStaffError('Failed to update order status.');
              } finally {
                setStatusUpdating((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
              }
            }}
            onCancelOrder={handleCancelOrder}
            onDeleteOrder={async (orderId) => {
              setStatusUpdating((prev) => new Set(prev).add(orderId));
              try {
                await api.orders.deleteOrder(orderId);
                const staffOrders = await api.orders.list();
                setOrders(staffOrders);
                saveOrders(staffOrders);
              } catch (err: any) {
                if (err?.response?.status === 403) setStaffError('You do not have permission to delete this order.');
                else if (err?.response?.status === 400) setStaffError(err?.response?.data?.error || 'Cannot delete this order.');
                else setStaffError('Failed to delete order.');
                throw err;
              } finally {
                setStatusUpdating((prev) => { const next = new Set(prev); next.delete(orderId); return next; });
              }
            }}
            onAddCategory={async (name) => {
              const trimmed = name.trim();
              const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `category-${Date.now()}`;
              await api.categories.create({ name: trimmed, slug });
              const cats = await api.categories.list({ strict: true });
              setCategories(cats);
              saveCategories(cats);
            }}
            onUpdateCategory={async (id, name) => {
              const trimmed = name.trim();
              await api.categories.update(id, { name: trimmed });
              const [cats, items] = await Promise.all([
                api.categories.list({ strict: true }),
                api.menu.list({ include_inactive: true, strict: true }),
              ]);
              setCategories(cats);
              saveCategories(cats);
              setMenuItems(items);
              saveMenuItems(items);
            }}
            onDeleteCategory={async (id) => {
              await api.categories.delete(id);
              const [cats, items] = await Promise.all([
                api.categories.list({ strict: true }),
                api.menu.list({ include_inactive: true, strict: true }),
              ]);
              setCategories(cats);
              saveCategories(cats);
              setMenuItems(items);
              saveMenuItems(items);
            }}
            onCategoriesSynced={(cats) => {
              setCategories(cats);
              saveCategories(cats);
            }}
            onOpenQRModalForTable={(tbl) => {
              setActiveTableNum(tbl);
              setIsTableModalOpen(true);
            }}
          />
        </>
      )}

      {/* Wishlist Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4" onClick={() => setIsWishlistOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">Wishlist</h3>
              <button onClick={() => setIsWishlistOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="text-stone-500 text-sm">No favourites yet.</p>
            ) : (
              <div className="space-y-3">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-200">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-stone-900 truncate">{item.name}</div>
                      <div className="text-xs text-amber-600">{formatINR(item.price)}</div>
                    </div>
                    <button type="button" onClick={() => handleAddToCart(item)} className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold">Add</button>
                    <button type="button" onClick={() => toggleWishlist(item.id)} className="text-red-500 hover:text-red-400" aria-label="Remove from wishlist"><Heart className="w-4 h-4 fill-red-500" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4" onClick={() => setIsLocationOpen(false)}>
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-900">Restaurant Location</h3>
              <button onClick={() => setIsLocationOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <p className="text-sm text-stone-600 mb-3">42 Heritage Boulevard, Indiranagar, Bengaluru, KA 560038</p>
            <div className="rounded-xl overflow-hidden border border-stone-200">
              <iframe
                title="Restaurant location"
                src="https://www.google.com/maps?q=42+Heritage+Boulevard,+Indiranagar,+Bengaluru,+KA+560038&output=embed"
                className="w-full h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=42+Heritage+Boulevard,+Indiranagar,+Bengaluru,+KA+560038"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold"
            >
              Get Directions <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        activeTable={activeTableNum}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewKitchen={() => { setConfirmedOrder(null); navigate('/kitchen'); }}
      />

      {/* Table QR Modal */}
      <TableQRModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
        activeTable={activeTableNum}
        onSelectTable={handleSelectTable}
      />

      {/* Floating Food Assistant (customer view only) */}
      {activeView === 'customer' && (
        <FoodAssistant menuItems={menuItems} categories={categories} onAddToCart={handleAddToCart} />
      )}
      </motion.div>
      </AnimatePresence>
  );
}
