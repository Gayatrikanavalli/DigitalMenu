import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, Category, FoodType } from '../types';
import { formatINR } from '../lib/storage';
import { MenuCard } from './MenuCard';
import * as Lucide from 'lucide-react/dist/esm/lucide-react.js';

interface ShopPageProps {
  categories: Category[];
  menuItems: MenuItem[];
  cart: { menuItem: MenuItem; quantity: number }[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onToggleWishlist: (id: string) => void;
  wishlist: string[];
  onNavigate: (view: string, category?: string) => void;
  activeTable: string;
  onOpenTableModal: () => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  cartCount?: number;
  cartTotal?: number;
  initialDrawerOpen?: boolean;
  initialCategory?: string;
}

const CATEGORY_IMAGES: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=300&auto=format&fit=crop',
  starters: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=300&auto=format&fit=crop',
  curries: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=300&auto=format&fit=crop',
  breads: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=300&auto=format&fit=crop',
  desserts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=300&auto=format&fit=crop',
  beverages: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=300&auto=format&fit=crop',
  'south-indian': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=300&auto=format&fit=crop',
  chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=300&auto=format&fit=crop',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop',
  dosa: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=300&auto=format&fit=crop',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=300&auto=format&fit=crop',
  salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=300&auto=format&fit=crop',
  'ice-cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=300&auto=format&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop',
  all: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop',
};

const NAV_LINKS = [
  { label: 'Home', path: '/', icon: Lucide.Home },
  { label: 'Menu', path: '/menu', icon: Lucide.UtensilsCrossed },
  { label: 'Offers', path: '/offers', icon: Lucide.Tag },
  { label: 'My Orders', path: '/my-orders', icon: Lucide.ShoppingBag },
  { label: 'About', path: '/about', icon: Lucide.Info },
  { label: 'Contact', path: '/contact', icon: Lucide.Phone },
];

const isNavActive = (linkPath: string, currentPath: string) => {
  const path = (currentPath || '/').split('?')[0].split('#')[0] || '/';
  if (linkPath === '/') return path === '/' || path === '/customer';
  if (linkPath === '/my-orders') return path === '/my-orders' || path === '/orders';
  if (linkPath === '/menu') return path === '/menu' || path.startsWith('/menu/');
  return path === linkPath;
};

export const ShopPage: React.FC<ShopPageProps> = ({
  categories,
  menuItems,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  wishlist,
  onNavigate,
  activeTable,
  onOpenTableModal,
  onOpenCart,
  onOpenWishlist,
  cartCount = 0,
  cartTotal = 0,
  initialDrawerOpen,
  initialCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [dietFilter, setDietFilter] = useState<'all' | FoodType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(initialDrawerOpen ?? false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 9;

  const filteredDishes = useMemo(() => {
    return menuItems.filter((dish) => {
      if (dish.isActive === false || dish.isAvailable === false) return false;
      if (selectedCategory !== 'all' && String(dish.category) !== selectedCategory) return false;
      if (dietFilter !== 'all' && dish.foodType !== dietFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (
          !dish.name.toLowerCase().includes(q) &&
          !dish.description.toLowerCase().includes(q) &&
          !String(dish.category).toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietFilter, searchQuery]);

  const sortedDishes = useMemo(() => {
    const sorted = [...filteredDishes];
    switch (sortBy) {
      case 'price-low': return sorted.sort((a, b) => a.price - b.price);
      case 'price-high': return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'popularity': return sorted.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
      default: return sorted;
    }
  }, [filteredDishes, sortBy]);

  const totalItems = sortedDishes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDishes = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedDishes.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedDishes, safePage]);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(safePage * ITEMS_PER_PAGE, totalItems);

  const getItemCartQty = useCallback((itemId: string) => {
    const found = cart.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  }, [cart]);

  const handleCategorySelect = useCallback((slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    setMobileDrawerOpen(false);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [selectedCategory, searchQuery, dietFilter]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);
  useEffect(() => { setMobileDrawerOpen(initialDrawerOpen ?? false); }, [initialDrawerOpen]);
  useEffect(() => { if (initialCategory) { setSelectedCategory(initialCategory); setCurrentPage(1); } }, [initialCategory]);
  useEffect(() => { setMobileDrawerOpen(false); }, [selectedCategory]);
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileDrawerOpen]);

  const sidebarCategories = useMemo(() => categories.filter((c) => c.slug !== 'all'), [categories]);

  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col">
      <main className="flex-1 overflow-hidden bg-white">
        <div className="flex min-h-screen">
          {/* LEFT SIDEBAR - Navigation (Desktop: permanent, Mobile: drawer) */}
          <aside className="w-[220px] flex-shrink-0 bg-[#FFF1E0] flex flex-col hidden lg:flex min-h-screen">
            <div className="p-5 border-b border-amber-200/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-xl shadow-sm">भ</div>
                <div className="flex flex-col leading-tight">
                  <span className="text-base font-bold tracking-tight font-serif text-stone-900">
                    Bhojan<span className="text-amber-700 font-sans font-extrabold">QR</span>
                  </span>
                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">Digital Menu</span>
                </div>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
              {NAV_LINKS.map((link, index) => {
                const Icon = link.icon;
                const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
                const isCurrent = isNavActive(link.path, currentPath);
                return (
                  <motion.button
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + index * 0.03 }}
                    type="button"
                    onClick={() => {
                      if (link.path === '/orders') { onOpenCart(); } else { onNavigate(link.path); }
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isCurrent ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-700 hover:bg-amber-100/70'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-stone-600'}`} strokeWidth={1.8} />
                    <span>{link.label}</span>
                  </motion.button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-amber-200/70">
              <button onClick={() => onOpenTableModal()} className="w-full text-left px-2 py-2 text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900 transition-colors">Change Table</button>
              <p className="text-[10px] text-stone-500 mt-2">Order from your table</p>
            </div>
          </aside>

          {/* REMAINING CONTENT AREA */}
          <div className="flex-1 min-w-0 flex flex-col min-h-screen">
            <div className="sticky top-0 z-30 h-14 bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMobileDrawerOpen(true)} className="lg:hidden p-2 -ml-2 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100" aria-label="Open menu">
                  <Lucide.Menu className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onOpenWishlist()} className="p-2.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100" aria-label="Wishlist">
                  <Lucide.Heart className="w-5 h-5" />
                </button>
                <button type="button" className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm shadow-sm transition-all whitespace-nowrap" onClick={() => onOpenCart()}>
                  <Lucide.ShoppingBag className="w-4 h-4" />
                  <span>My Order</span>
                  {cartCount > 0 && <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 font-bold text-xs tabular-nums">{cartCount}</span>}
                  {cartTotal > 0 && <span className="hidden sm:inline border-l border-amber-500/40 pl-2 font-semibold tabular-nums">{formatINR(cartTotal)}</span>}
                </button>
              </div>
            </div>
            <div className="px-4 sm:px-6 lg:px-8 pt-2 pb-0 bg-white">
              <button type="button" onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) { window.history.back(); } else { onNavigate('/'); } }} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-amber-700 transition-colors">
                <Lucide.ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
            <div className="flex-1 min-w-0 flex bg-white">
              {/* MIDDLE SECTION - Categories Panel */}
              <aside className="w-[280px] flex-shrink-0 bg-white border-r border-stone-200 flex flex-col hidden lg:flex">
                <div className="px-4 pt-2 pb-3 border-b border-stone-200 bg-white">
                  <h2 className="text-lg font-bold text-stone-900 font-serif">Categories</h2>
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="py-4 space-y-1 overflow-y-auto flex-1">
                  <motion.button initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} type="button" onClick={() => handleCategorySelect('all')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
                    <div className="flex items-center gap-3">
                      <img src={CATEGORY_IMAGES.all} alt="All Dishes" className="w-8 h-8 rounded-lg object-cover" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = CATEGORY_IMAGES.all; }} />
                      <span>All Dishes</span>
                    </div>
                  </motion.button>
                  {sidebarCategories.map((cat, index) => {
                    const isActive = selectedCategory === cat.slug;
                    return (
                      <motion.button key={cat.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.03 }} type="button" onClick={() => handleCategorySelect(cat.slug)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
                        <div className="flex items-center gap-3">
                          <img src={CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.all} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = CATEGORY_IMAGES.all; }} />
                          <span>{cat.name}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </aside>

              {/* RIGHT SECTION - Food Items */}
              <div className="flex-1 min-w-0 overflow-y-auto bg-white">
                <div className="px-4 sm:px-6 lg:px-8 pt-3 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md sm:max-w-xs">
                      <Lucide.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search dishes..." className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-400 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-stone-50 rounded-lg border border-stone-200 shrink-0 flex-wrap sm:flex-nowrap">
                      <button onClick={() => setDietFilter('all')} className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${dietFilter === 'all' ? 'bg-amber-500 text-black shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}>All</button>
                      <button onClick={() => setDietFilter('veg')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${dietFilter === 'veg' ? 'bg-white text-emerald-800 shadow-xs border border-emerald-100' : 'text-stone-500 hover:text-emerald-800'}`}>
                        <span className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center bg-white"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /></span>
                        Veg
                      </button>
                      <button onClick={() => setDietFilter('non-veg')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${dietFilter === 'non-veg' ? 'bg-white text-red-800 shadow-xs border border-red-100' : 'text-stone-500 hover:text-red-800'}`}>
                        <span className="w-3.5 h-3.5 rounded-[3px] border border-red-700 flex items-center justify-center bg-white"><span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-700" /></span>
                        Non-Veg
                      </button>
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-stone-200 text-stone-900 focus:outline-none focus:border-amber-500 cursor-pointer whitespace-nowrap" aria-label="Sort dishes">
                        <option value="relevance">Relevance</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="name-asc">Name: A to Z</option>
                        <option value="popularity">Popularity</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-600 font-semibold mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <span>{totalItems === 0 ? 'Showing 0 dishes' : `Showing ${startItem}–${endItem} of ${totalItems} dishes`}</span>
                  </div>

                  {sortedDishes.length === 0 ? (
                    <div className="text-center py-16 bg-stone-50 rounded-2xl border border-stone-200">
                      <Lucide.UtensilsCrossed className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-stone-900">No dishes found</h3>
                      <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Try a different search term or clear your filters.</p>
                      <button onClick={() => { setSelectedCategory('all'); setDietFilter('all'); setSearchQuery(''); setSortBy('relevance'); setCurrentPage(1); }} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700">Clear Filters &amp; Show All</button>
                    </div>
                  ) : (
                    <>
                      <div className="bq-menu-grid">
                        {paginatedDishes.map((dish) => (
                          <div key={dish.id} className="group w-full min-w-0 max-w-[320px]">
                            <MenuCard
                              item={dish}
                              cartQuantity={getItemCartQty(dish.id)}
                              onAddToCart={onAddToCart}
                              onUpdateQuantity={onUpdateQuantity}
                              isWishlisted={wishlist.includes(dish.id)}
                              onToggleWishlist={onToggleWishlist}
                              onQuickView={(item) => onNavigate(`/menu/${item.id}`)}
                            />
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                          <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <Lucide.ChevronLeft className="w-4 h-4" />
                            <span>Previous</span>
                          </button>
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button key={page} type="button" onClick={() => setCurrentPage(page)} aria-current={page === safePage ? 'page' : undefined} className={`min-w-[36px] h-9 px-2 rounded-lg text-sm font-semibold transition-colors ${page === safePage ? 'bg-amber-600 text-white shadow-sm' : 'bg-white border border-stone-200 text-stone-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700'}`}>{page}</button>
                            ))}
                          </div>
                          <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                            <span>Next</span>
                            <Lucide.ChevronRight className="w-4 h-4" />
                          </button>
                        </nav>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-stone-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-amber-500/40">भ</div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xl font-bold tracking-tight font-serif text-stone-900">Bhojan<span className="text-amber-600 font-sans font-extrabold">QR</span></span>
                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">Digital Menu</span>
                </div>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">Celebrating the royal heritage of slow dum cooking, charcoal tandoor roasts, and time-honored Mughlai recipes — served straight to your table.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Quick Links</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li><button onClick={() => onNavigate('/')} className="w-full text-left hover:text-amber-600">Home</button></li>
                <li><button onClick={() => onOpenCart()} className="w-full text-left hover:text-amber-600">My Order</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-stone-200 text-xs text-stone-500">© {new Date().getFullYear()} BhojanQR. All rights reserved.</div>
        </div>
      </footer>

      {/* Mobile Navigation + Categories Drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-stone-900/30 lg:hidden" onClick={() => setMobileDrawerOpen(false)} aria-hidden="true" />
            <motion.div initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-y-0 left-0 z-50 w-[220px] max-w-[45vw] bg-[#FFF1E0] shadow-xl lg:hidden flex flex-col overflow-x-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-amber-200/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-lg">भ</div>
                  <span className="text-base font-bold text-stone-900 font-serif">BhojanQR</span>
                </div>
                <button type="button" onClick={() => setMobileDrawerOpen(false)} className="text-stone-500 hover:text-stone-800"><Lucide.X className="w-5 h-5" /></button>
              </div>
              <div className="py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden flex-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
                  const isCurrent = isNavActive(link.path, currentPath);
                  return (
                    <button key={link.label} type="button" onClick={() => { onNavigate(link.path); setMobileDrawerOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isCurrent ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-700 hover:bg-amber-100/70'}`}>
                      <Icon className={`w-5 h-5 ${isCurrent ? 'text-white' : 'text-stone-600'}`} strokeWidth={1.8} />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
                <div className="mt-4 pt-3 border-t border-amber-200/70 px-1">
                  <button onClick={() => { onOpenTableModal(); setMobileDrawerOpen(false); }} className="w-full text-left px-2 py-2 text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900">Change Table</button>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ x: -500 }} animate={{ x: -220 }} exit={{ x: -500 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-y-0 left-[220px] z-50 w-[280px] bg-white border-r border-stone-200 shadow-xl lg:hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-white">
                <h2 className="text-lg font-bold text-stone-900 font-serif">Categories</h2>
                <button type="button" onClick={() => setMobileDrawerOpen(false)} className="text-stone-400 hover:text-stone-700"><Lucide.X className="w-5 h-5" /></button>
              </div>
              <div className="py-4 space-y-1 overflow-y-auto flex-1">
                <button type="button" onClick={() => handleCategorySelect('all')} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
                  <div className="flex items-center gap-3">
                    <img src={CATEGORY_IMAGES.all} alt="All Dishes" className="w-8 h-8 rounded-lg object-cover" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = CATEGORY_IMAGES.all; }} />
                    <span>All Dishes</span>
                  </div>
                </button>
                {sidebarCategories.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => handleCategorySelect(cat.slug)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat.slug ? 'bg-amber-500 text-white font-semibold shadow-md' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
                    <div className="flex items-center gap-3">
                      <img src={CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.all} alt={cat.name} className="w-8 h-8 rounded-lg object-cover" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = CATEGORY_IMAGES.all; }} />
                      <span>{cat.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
