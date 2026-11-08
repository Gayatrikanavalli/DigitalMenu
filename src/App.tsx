import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import { HERO_IMAGE } from './lib/initialData';
import { api } from './lib/api';
import { auth } from './lib/auth';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { CategoryCarousel } from './components/CategoryCarousel';
import { CategoryBar } from './components/CategoryBar';
import { MenuCard } from './components/MenuCard';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { KitchenDashboard } from './components/KitchenDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { TableQRModal } from './components/TableQRModal';
import { Footer } from './components/Footer';
import { LoginForm } from './components/LoginForm';
import { Sparkles, Clock, UtensilsCrossed, RotateCcw, QrCode, Phone, Mail, MapPin, Heart } from 'lucide-react';
import { FoodAssistant } from './components/FoodAssistant';

const ROUTES = {
  customer: '/',
  admin: '/admin',
  kitchen: '/kitchen',
} as const;

function getCurrentPath(): string {
  const p = typeof window !== 'undefined' ? window.location.pathname : '/';
  console.log('[TRACE] getCurrentPath ->', p);
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

  // Customer filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietFilter, setDietFilter] = useState<'all' | FoodType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');

  // Demo mode flag (env-controlled): shows/hides developer-facing conveniences
  const demoMode =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEMO_MODE === 'true';

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
  const [isLocationOpen, setIsLocationOpen] = useState<boolean>(false);

  // Modals
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Customer order tracking (by order number, public endpoint)
  const [trackOrderNumber, setTrackOrderNumber] = useState<string>('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState<string>('');

  const menuSectionRef = useRef<HTMLDivElement>(null);
  const aboutSectionRef = useRef<HTMLDivElement>(null);
  const contactSectionRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = authState?.is_authenticated || false;
  const user: StaffUser | null = authState?.user ?? null;
  const isManager = authState?.is_manager || false;
  const isKitchenStaff = authState?.is_kitchen_staff || false;

  const isStaffView = activeView === 'admin' || activeView === 'kitchen';
  const requiresManager = activeView === 'admin';
  const requiresKitchen = activeView === 'kitchen';

  // Navigation using client-side history (keeps the SPA on one Next.js route)
  const navigate = useCallback((view: ActiveView) => {
    const target = ROUTES[view];
    console.log('[TRACE] navigate ->', view, target, 'from', window.location.pathname);
    window.history.pushState({}, '', target);
    setPath(target);
  }, []);

  const scrollToSection = useCallback((section: string) => {
    const refMap: Record<string, React.RefObject<HTMLDivElement> | null> = {
      home: null,
      menu: menuSectionRef,
      about: aboutSectionRef,
      contact: contactSectionRef,
    };
    const ref = refMap[section];
    if (ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [menuSectionRef, aboutSectionRef, contactSectionRef]);

  const handleLogout = async () => {
    console.log('[TRACE] handleLogout called');
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
    console.log('[TRACE] handleLogout redirecting to', ROUTES.customer);
    setLoginError('');
  };

  const handleLogin = async (username: string, password: string) => {
    console.log('[TRACE] handleLogin called for', username);
    setLoginError('');
    setStaffError('');
    try {
      await auth.login(username, password);
      console.log('[TRACE] handleLogin -> auth.login succeeded');
      await refreshAuth();
      // Redirect to the intended staff view, falling back to admin for managers.
      if (activeView === 'kitchen' || (isKitchenStaff && !isManager)) {
        console.log('[TRACE] handleLogin -> redirecting to kitchen');
        navigate('kitchen');
      } else {
        console.log('[TRACE] handleLogin -> redirecting to admin');
        navigate('admin');
      }
    } catch (err: any) {
      console.log('[TRACE] handleLogin -> auth.login failed:', err?.response?.status, err?.response?.data?.error);
      setLoginError(err?.response?.data?.error || 'Invalid username or password.');
    }
  };

  const refreshAuth = useCallback(async () => {
    console.log('[TRACE] refreshAuth -> auth.me()');
    try {
      const state = await auth.me();
      console.log('[TRACE] refreshAuth result:', state);
      setAuthState(state);
    } catch {
      console.log('[TRACE] refreshAuth -> auth.me() failed');
      setAuthState({ is_authenticated: false, user: null, is_manager: false, is_kitchen_staff: false });
    }
  }, []);

  // Track whether the user has ever been authenticated in this session.
  // Used by onSessionExpired to avoid redirecting to / on initial load.
  useEffect(() => {
    if (authState?.is_authenticated) {
      setWasAuthenticated(true);
    }
  }, [authState?.is_authenticated]);

  // Subscribe to storage updates (multi-tab or real-time simulation)
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
        if (found) {
          setConfirmedOrder(found);
        }
      }
    });

    return () => unsubscribe();
  }, [confirmedOrder]);

  // Sync shared menu data from Django (with localStorage fallback)
  useEffect(() => {
    let mounted = true;
    const loadShared = async () => {
      try {
        const cats = await api.categories.list();
        if (mounted) {
          setCategories(cats);
          saveCategories(cats);
        }
      } catch { /* fallback already loaded */ }
      try {
        const items = await api.menu.list({ include_inactive: true });
        if (mounted) {
          setMenuItems(items);
          saveMenuItems(items);
        }
      } catch { /* fallback already loaded */ }
      try {
        const tbls = await api.tables.list();
        if (tbls.length && mounted) {
          setTables(tbls);
          saveTables(tbls);
        }
      } catch { /* fallback already loaded */ }
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

  // Initialize auth on mount; handle popstate (back/forward) routing
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

    // Session expired / 401 / 403 from the backend: clear auth and cached data.
    const onSessionExpired = () => {
      console.log('[TRACE] onSessionExpired fired, wasAuthenticated=', wasAuthenticated);
      setAuthState({ is_authenticated: false, user: null, is_manager: false, is_kitchen_staff: false });
      setAuthChecked(true);
      clearCachedData();
      setLoginError('');
      // Only redirect to customer page if the user was previously authenticated.
      // On initial load (never authenticated), stay on the current staff route
      // so the login form remains visible instead of bouncing to /.
      if (wasAuthenticated) {
        setPath(ROUTES.customer);
        window.history.replaceState({}, '', ROUTES.customer);
        console.log('[TRACE] onSessionExpired -> redirecting to', ROUTES.customer);
      } else {
        console.log('[TRACE] onSessionExpired -> not previously authenticated, staying on staff route');
      }
    };
    window.addEventListener('auth:session-expired', onSessionExpired);

    return () => {
      mounted = false;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('auth:session-expired', onSessionExpired);
    };
  }, [refreshAuth]);

  // Load staff-only order data when entering admin/kitchen views
  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;
    console.log('[TRACE] loadStaffOrders effect: activeView=', activeView, 'isAuthenticated=', isAuthenticated);
    let mounted = true;
    const loadStaffOrders = async () => {
      try {
        if (activeView === 'admin') {
          const staffOrders = await api.orders.list();
          if (mounted) {
            setOrders(staffOrders);
            saveOrders(staffOrders);
          }
        } else if (activeView === 'kitchen') {
          const feed = await api.orders.kitchenFeed();
          if (mounted) {
            setOrders(feed);
            saveOrders(feed);
          }
        }
      } catch (err: any) {
        // On 401/403, session expired: clear orders and let auth gate handle redirect.
        // On 403 (permission denied), show an error instead of logging out.
        console.log('[TRACE] loadStaffOrders API failed -> session expired redirect may follow');
        const status = err?.response?.status;
        if (status === 403) {
          setStaffError('You do not have permission to view these orders.');
        }
        setOrders([]);
        saveOrders([]);
      }
    };
    void loadStaffOrders();
    const refreshInterval = window.setInterval(() => {
      if (mounted) void loadStaffOrders();
    }, 15000);
    return () => {
      mounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [activeView, authChecked, isAuthenticated]);

  // Reset orders state when not authenticated: never expose cached order data
  // on staff routes before a valid session is established.
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      setOrders([]);
      saveOrders([]);
    }
  }, [authChecked, isAuthenticated]);

  // Derive orders only when authenticated on a staff view; never expose
  // cached order data before a valid session is established.
  const staffOrders = useMemo(() => {
    if (!isAuthenticated || !isStaffView) return [];
    return orders;
  }, [orders, isAuthenticated, isStaffView]);

  // Calculate cart counts and total
  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [cart]);

  // Cart operations
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
      if (newQty <= 0) {
        return prev.filter((ci) => ci.menuItem.id !== itemId);
      }
      return prev.map((ci) =>
        ci.menuItem.id === itemId ? { ...ci, quantity: newQty } : ci
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Switch table from QR modal or header
  const handleSelectTable = (tableNum: string) => {
    setActiveTable(tableNum);
    setActiveTableNum(tableNum);
  };

  // Place order flow via Axios API client (public - no registration required)
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

  // Track a customer's own order by order number (public endpoint)
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

  // Cancel an order (Admin action)
  const handleCancelOrder = async (orderId: string) => {
    await api.orders.cancelOrder(orderId);
    // Refresh staff orders to reflect cancellation
    if (activeView === 'admin') {
      try {
        const staffOrders = await api.orders.list();
        if (staffOrders.length) {
          setOrders(staffOrders);
          saveOrders(staffOrders);
        }
      } catch {
        // keep existing local orders
      }
    }
  };

  // Chef Specials items
  const specialDishes = useMemo(() => {
    return menuItems.filter((dish) => dish.isSpecial && dish.isAvailable && dish.isActive !== false);
  }, [menuItems]);

  // Filter menu items
  const filteredDishes = useMemo(() => {
    // Specials already shown in the "Chef's Handpicked Specials" section above;
    // exclude them from the main grid to avoid duplicate cards (default view only).
    const shownSpecialIds = new Set(
      selectedCategory === 'all' && !searchQuery
        ? specialDishes.slice(0, 4).map((d) => d.id)
        : []
    );

    const filtered = menuItems.filter((dish) => {
      if (shownSpecialIds.has(dish.id)) return false;
      if (dish.isActive === false || dish.isAvailable === false) return false;
      if (selectedCategory !== 'all' && dish.category !== selectedCategory) {
        return false;
      }
      if (dietFilter !== 'all' && dish.foodType !== dietFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = dish.name.toLowerCase().includes(query);
        const matchesDesc = dish.description.toLowerCase().includes(query);
        const matchesCategory = dish.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });

    switch (sortBy) {
      case 'price-low':
        return [...filtered].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...filtered].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case 'veg-first':
        return [...filtered].sort((a, b) => (a.foodType === 'veg' ? -1 : 1) - (b.foodType === 'veg' ? -1 : 1));
      case 'prep-time':
        return [...filtered].sort((a, b) => (a.preparationTimeMins || 0) - (b.preparationTimeMins || 0));
      case 'popularity':
        return [...filtered].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
      default:
        return filtered;
    }
  }, [menuItems, selectedCategory, dietFilter, searchQuery, sortBy, specialDishes]);

  // Quantity helper
  const getItemCartQty = (itemId: string) => {
    const found = cart.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  // Jump to menu
  const scrollToMenu = () => {
    menuSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loginIntended: LoginIntended = activeView === 'kitchen' ? 'kitchen' : 'admin';

  // Staff views: never show dashboard, loading spinner, or customer content
  // without a valid authenticated session. Render ONLY the login form.
  if (isStaffView) {
    console.log('[TRACE] staff view render:', { activeView, isAuthenticated, isManager, isKitchenStaff, requiresManager, requiresKitchen });
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
          <LoginForm
            intended={loginIntended}
            onLogin={handleLogin}
            onReturnToCustomer={() => navigate('customer')}
            error={loginError}
            demoMode={demoMode}
          />
        </div>
      );
    }
    // Authenticated staff: enforce role-based routing
    if (requiresManager && !isManager) {
      // Kitchen user attempting /admin -> send to kitchen instead
      console.log('[TRACE] redirecting /admin -> /kitchen (requiresManager && !isManager)');
      navigate('kitchen');
      return null;
    }
    if (requiresKitchen && !isKitchenStaff && !isManager) {
      console.log('[TRACE] redirecting /kitchen -> / (requiresKitchen && !isKitchenStaff && !isManager)');
      navigate('customer');
      return null;
    }
  }

  // Customer view: show loading state while auth is being validated
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-stone-300 text-xs font-medium">Loading BhojanQR&hellip;</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        activeView={activeView}
        isAuthenticated={isAuthenticated}
        user={user}
        isManager={isManager}
        isKitchenStaff={isKitchenStaff}
        onNavigate={navigate}
        onScrollTo={scrollToSection}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTable={activeTableNum}
        onOpenTableModal={() => setIsTableModalOpen(true)}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenLocation={() => setIsLocationOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* VIEW: CUSTOMER MENU */}
      {activeView === 'customer' && (
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 bg-[#0b0b0b] text-white">
          
          {/* Hero Promotional Banner */}
          <HeroBanner
            activeTable={activeTableNum}
            onExploreMenu={scrollToMenu}
            onOpenTableModal={() => setIsTableModalOpen(true)}
          />

          <CategoryCarousel
            onSelectCategory={(slug) => {
              setSelectedCategory(slug);
              menuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />

          {/* Table Bar & Reset Banner */}
          <div className="flex items-center justify-between py-2 text-xs text-stone-700 border-b border-amber-900/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-700" />
              <span>Ordering directly for <strong>Table {activeTableNum}</strong></span>
              <button
                onClick={() => setIsTableModalOpen(true)}
                className="text-amber-800 underline hover:text-amber-900 font-bold ml-1"
              >
                Change Table
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetDemoData}
                title="Reset sample dishes and orders"
                className="text-stone-700 hover:text-stone-900 flex items-center gap-1 text-[11px]"
              >
                <RotateCcw className="w-3 h-3 text-stone-600" />
                <span className="hidden sm:inline">Reset Demo Data</span>
              </button>
            </div>
          </div>

          {/* Customer Order Tracker */}
          <div className="border-b border-amber-900/20 py-3 bg-[#111]/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                Track Your Order
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={trackOrderNumber}
                  onChange={(e) => setTrackOrderNumber(e.target.value)}
                  placeholder="Order number (e.g. BHOJAN-ABCDE)"
                  className="flex-1 min-w-0 text-xs px-2.5 py-1.5 rounded-lg border border-amber-900/30 focus:outline-none focus:border-amber-500 bg-[#181818] text-white"
                />
                <button
                  onClick={handleTrackOrder}
                  disabled={!trackOrderNumber.trim()}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 disabled:text-stone-400 text-white text-xs font-bold transition-colors whitespace-nowrap"
                >
                  Track
                </button>
              </div>
            </div>
            {trackError && (
              <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {trackError}
              </div>
            )}
            {trackedOrder && (
              <div className="mt-2 p-3 rounded-lg border border-amber-900/20 bg-[#181818] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-stone-900">{trackedOrder.orderNumber}</span>
                  <span className={`font-bold text-xs ${trackedOrder.status === 'completed' ? 'text-emerald-700' : trackedOrder.status === 'cancelled' ? 'text-red-700' : 'text-amber-700'}`}>
                    {trackedOrder.status}
                  </span>
                </div>
                <div className="text-stone-600">
                  Table {trackedOrder.tableNumber} · {trackedOrder.customerName} · {formatINR(trackedOrder.total)}
                </div>
              </div>
            )}
          </div>

          {/* Sort By (Customer) */}
          {/* Horizontal Food Categories & Diet Filter */}
          <div ref={menuSectionRef}>
            <CategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              dietFilter={dietFilter}
              setDietFilter={setDietFilter}
            />
          </div>

          {/* Section 1: Today's Chef Specials (shown when 'all' is selected and no search) */}
          {selectedCategory === 'all' && !searchQuery && specialDishes.length > 0 && (
            <section className="mt-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Royal Heritage Recommendations</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                    Chef's Handpicked Specials
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {specialDishes.slice(0, 4).map((dish) => (
                  <MenuCard
                    key={`special-${dish.id}`}
                    item={dish}
                    cartQuantity={getItemCartQty(dish.id)}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    isWishlisted={wishlist.includes(dish.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Popular Dishes & Full Category Grid */}
          <section className="mt-8 mb-12">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
                  {selectedCategory === 'all'
                    ? 'All Dishes & Dum Delicacies'
                    : categories.find((c) => c.slug === selectedCategory)?.name || 'Menu'}
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  Showing {filteredDishes.length} freshly prepared dishes
                  {dietFilter !== 'all' && ` (${dietFilter === 'veg' ? 'Pure Vegetarian' : 'Non-Vegetarian'})`}
                </p>
              </div>
            </div>

            {filteredDishes.length === 0 ? (
              <div className="text-center py-16 bg-[#181818] rounded-2xl border border-amber-900/20">
                <UtensilsCrossed className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No dishes found</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  Try a different search term or clear your filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setDietFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700"
                >
                  Clear Filters & Show All
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {filteredDishes.map((dish) => (
                  <MenuCard
                    key={dish.id}
                    item={dish}
                    cartQuantity={getItemCartQty(dish.id)}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    isWishlisted={wishlist.includes(dish.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Section: About Us */}
          <section ref={aboutSectionRef} id="about" className="mt-16 mb-12 py-12 bg-[#181818] border border-amber-900/20 rounded-3xl overflow-hidden">
            <div className="lg:flex lg:items-center lg:gap-12">
              <div className="lg:w-1/2 px-6">
                <div className="flex flex-col items-center justify-center h-64 sm:h-80 bg-[#111] rounded-2xl border border-amber-900/20 overflow-hidden">
                  <img
                    src={HERO_IMAGE}
                    alt="Royal Indian Dining Interior"
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="lg:w-1/2 px-6">
                <div className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-wider text-xs mb-3">
                  <Heart className="w-4 h-4" />
                  <span>Our Story</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mb-4 leading-tight">
                  Rooted in Royal Heritage, Served with Pride
                </h2>
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                  BhojanQR celebrates the time-honored art of slow dum cooking — where aged Basmati rice,
                  freshly ground whole spices, and succulent meats are sealed in a handi and simmered over
                  low charcoal embers for hours. Every dish carries the legacy of royal Mughlai kitchens and
                  coastal Indian traditions, brought to your table with care.
                </p>
                <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6">
                  We source premium ingredients, prepare everything fresh daily in our dedicated vegetarian
                  and non-vegetarian kitchens, and serve 100% halal certified meats cooked in pure ghee.
                  Quality, authenticity, and hospitality are at the heart of every plate we serve.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#111] border border-amber-900/20 text-center">
                    <div className="text-2xl font-bold text-amber-700">100%</div>
                    <div className="text-xs text-stone-500 uppercase tracking-wider font-medium mt-1">Halal Meats</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#111] border border-amber-900/20 text-center">
                    <div className="text-2xl font-bold text-emerald-700">Dedicated</div>
                    <div className="text-xs text-stone-500 uppercase tracking-wider font-medium mt-1">Veg Kitchen</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#111] border border-amber-900/20 text-center">
                    <div className="text-2xl font-bold text-blue-700">Pure</div>
                    <div className="text-xs text-stone-500 uppercase tracking-wider font-medium mt-1">Ghee Cooking</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Contact */}
          <section ref={contactSectionRef} id="contact" className="mb-12">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-amber-700 font-bold uppercase tracking-wider text-xs mb-3">
                <Phone className="w-4 h-4" />
                <span>Get in Touch</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 mb-8 leading-tight">
                Visit Us or Place a Catering Order
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-[#111] border border-amber-900/20 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Restaurant Address</div>
                        <div className="text-stone-600 text-sm leading-relaxed">
                          42 Heritage Boulevard<br />
                          Indiranagar, Bengaluru, KA 560038
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#111] border border-amber-900/20 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Opening Hours</div>
                        <div className="text-stone-600 text-sm space-y-1">
                          <div>Lunch: 12:00 PM – 4:00 PM</div>
                          <div>Dinner: 7:00 PM – 11:30 PM</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#111] border border-amber-900/20 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Reservations &amp; Catering</div>
                        <div className="text-stone-600 text-sm space-y-1">
                          <div>+91 98765 43210</div>
                          <div>+91 98765 43211</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-[#111] border border-amber-900/20 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-stone-900">Email</div>
                        <div className="text-stone-600 text-sm leading-relaxed">
                          hello@bhojanqr.example
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-6 rounded-3xl bg-amber-600 text-white shadow-lg shadow-amber-500/40">
                    <div className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
                      Scan &amp; Order from Your Table
                    </div>
                    <div className="text-xl font-serif font-bold text-white">
                      Table {activeTableNum}
                    </div>
                    <p className="text-amber-100/90 text-sm mt-2 leading-relaxed">
                      Use the table QR code to browse the menu, add items to your cart, and place your order
                      directly from your seat. No registration required.
                    </p>
                    <button
                      onClick={() => setIsTableModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#181818] text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Change / Scan Table QR</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-xl bg-stone-800 text-stone-400 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-colors"
                    >
                      <Heart className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Mobile Bottom Sticky Cart Bar (Compliance with 15% mobile sticky cap) */}
          {cartCount > 0 && (
            <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40 max-h-[12vh]">
              <button
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl p-3 shadow-xl flex items-center justify-between font-bold text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#181818] text-amber-700 flex items-center justify-center font-black text-xs tabular-nums">
                    {cartCount}
                  </span>
                  <span>View Table {activeTableNum} Order</span>
                </div>
                <div className="flex items-center gap-1 text-sm tabular-nums">
                  <span>{formatINR(cartTotal)}</span>
                  <span>→</span>
                </div>
              </button>
            </div>
          )}

        </main>
      )}

      {/* VIEW: KITCHEN DISPLAY */}
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
              // Refresh staff orders after a successful status change so the UI
              // reflects the updated database state.
              if (activeView === 'kitchen') {
                const feed = await api.orders.kitchenFeed();
                setOrders(feed);
                saveOrders(feed);
              } else if (activeView === 'admin') {
                const staffOrders = await api.orders.list();
                setOrders(staffOrders);
                saveOrders(staffOrders);
              }
            } catch (err: any) {
              const statusCode = err?.response?.status;
              if (statusCode === 403) {
                setStaffError('You do not have permission to update this order.');
              } else {
                setStaffError('Failed to update order status. Please try again.');
              }
            } finally {
              setStatusUpdating((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
              });
            }
          }}
        />
        </>
      )}

      {/* VIEW: ADMIN PORTAL */}
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
            await api.menu.create(item);
            const items = await api.menu.list({ include_inactive: true });
            setMenuItems(items);
            saveMenuItems(items);
          }}
          onUpdateMenuItem={async (id, updates) => {
            try {
              await api.menu.update(id, updates);
              const items = await api.menu.list({ include_inactive: true });
              setMenuItems(items);
              saveMenuItems(items);
            } catch (err: any) {
              setStaffError(err?.response?.data?.detail || err?.message || 'Failed to update menu item. Please try again.');
            }
          }}
          onDeleteMenuItem={async (id) => {
            await api.menu.delete(id);
            const items = await api.menu.list({ include_inactive: true });
            setMenuItems(items);
            saveMenuItems(items);
          }}
          onToggleAvailability={async (id) => {
            const current = menuItems.find((m) => m.id === id);
            try {
              await api.menu.update(id, { isAvailable: !(current?.isAvailable ?? true) });
              const items = await api.menu.list({ include_inactive: true });
              setMenuItems(items);
              saveMenuItems(items);
            } catch (err: any) {
              setStaffError(err?.response?.data?.detail || err?.message || 'Failed to update stock status. Please try again.');
            }
          }}
          onAddTable={async (table) => {
            await api.tables.create(table);
          }}
          onUpdateOrderStatus={async (orderId, status) => {
            setStatusUpdating((prev) => new Set(prev).add(orderId));
            try {
              await api.orders.updateStatus(orderId, status);
              if (activeView === 'admin') {
                const staffOrders = await api.orders.list();
                setOrders(staffOrders);
                saveOrders(staffOrders);
              }
            } catch (err: any) {
              const statusCode = err?.response?.status;
              if (statusCode === 403) {
                setStaffError('You do not have permission to update this order.');
              } else {
                setStaffError('Failed to update order status. Please try again.');
              }
            } finally {
              setStatusUpdating((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
              });
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
              const statusCode = err?.response?.status;
              if (statusCode === 403) {
                setStaffError('You do not have permission to delete this order.');
              } else if (statusCode === 400) {
                setStaffError(err?.response?.data?.error || 'Cannot delete this order.');
              } else {
                setStaffError('Failed to delete order. Please try again.');
              }
              throw err;
            } finally {
              setStatusUpdating((prev) => {
                const next = new Set(prev);
                next.delete(orderId);
                return next;
              });
            }
          }}
          onAddCategory={async (name) => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await api.categories.create({ name, slug });
            const cats = await api.categories.list();
            setCategories(cats);
            saveCategories(cats);
          }}
          onUpdateCategory={async (id, name) => {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            await api.categories.update(id, { name, slug });
            const cats = await api.categories.list();
            setCategories(cats);
            saveCategories(cats);
          }}
          onDeleteCategory={async (id) => {
            await api.categories.delete(id);
            const cats = await api.categories.list();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsWishlistOpen(false)}>
          <div className="w-full max-w-md bg-[#181818] rounded-2xl border border-amber-900/30 p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Wishlist</h3>
              <button onClick={() => setIsWishlistOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="text-stone-400 text-sm">No favourites yet.</p>
            ) : (
              <div className="space-y-3">
                {wishlistItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-[#292929] rounded-xl p-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{item.name}</div>
                      <div className="text-xs text-amber-400">{formatINR(item.price)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWishlist(item.id)}
                      className="text-red-500 hover:text-red-400"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 fill-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Location Modal */}
      {isLocationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setIsLocationOpen(false)}>
          <div className="w-full max-w-2xl bg-[#181818] rounded-2xl border border-amber-900/30 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Restaurant Location</h3>
              <button onClick={() => setIsLocationOpen(false)} className="text-stone-400 hover:text-white">✕</button>
            </div>
            <p className="text-sm text-stone-300 mb-3">42 Heritage Boulevard, Indiranagar, Bengaluru, KA 560038</p>
            <div className="rounded-xl overflow-hidden border border-amber-900/30">
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
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-900 text-sm font-bold"
            >
              Get Directions
            </a>
          </div>
        </div>
      )}

      {/* Cart Slide-over Drawer */}
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

      {/* Order Confirmation & Live Tracker Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewKitchen={() => {
          setConfirmedOrder(null);
          navigate('kitchen');
        }}
      />

      {/* Table QR Management & Scanner Modal */}
      <TableQRModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
        activeTable={activeTableNum}
        onSelectTable={handleSelectTable}
      />

      {/* Floating Food Assistant (customer view only) */}
      {activeView === 'customer' && (
        <FoodAssistant
          menuItems={menuItems}
          categories={categories}
          onAddToCart={handleAddToCart}
        />
      )}

    </div>
  );
}
