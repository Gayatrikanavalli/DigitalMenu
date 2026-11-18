import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MenuItem, Category } from '../types';
import { formatINR } from '../lib/storage';
import { Search as SearchIcon, X, ChevronLeft, Heart, Plus, Minus, Menu as MenuIcon, Tag } from 'lucide-react';

// Category thumbnail images for the sidebar
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

interface OffersPageProps {
  menuItems: MenuItem[];
  cart: { menuItem: MenuItem; quantity: number }[];
  categories: Category[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onToggleWishlist: (id: string) => void;
  wishlist: string[];
  onNavigate: (view: string) => void;
  activeTable: string;
  onOpenTableModal: () => void;
  onOpenCart: () => void;
}

const isDateActive = (item: MenuItem) => {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (item.offerStartDate && ymd < item.offerStartDate) return false;
  if (item.offerEndDate && ymd > item.offerEndDate) return false;
  return true;
};

const isConfiguredOffer = (item: MenuItem) => {
  if (item.isDeleted || item.isActive === false || item.isAvailable === false) return false;
  const discount = Number(item.discountPercentage || 0);
  if (discount <= 0) return false;
  if (item.offerActive === false) return false;
  if (item.isOfferActive === true) return true;
  if (item.isOfferActive === false) return false;
  return item.offerActive === true ? isDateActive(item) : discount > 0;
};

const OfferCard: React.FC<{
  item: MenuItem;
  discountPercentage: number;
  cartQuantity: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onQuickView?: (item: MenuItem) => void;
  categoryLabel: string;
}> = ({
  item,
  discountPercentage,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  categoryLabel,
}) => {
  const originalPrice = item.price;
  const discountedPrice = Math.round((originalPrice * (100 - discountPercentage)) / 100);
  const savings = Math.max(0, originalPrice - discountedPrice);
  const soldOut = !item.isAvailable || item.isActive === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative group bg-white rounded-xl border border-stone-200/80 p-2.5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col"
    >
      <div
        className="bq-menu-img-wrapper relative cursor-pointer"
        onClick={() => onQuickView?.(item)}
        role={onQuickView ? 'button' : undefined}
        tabIndex={onQuickView ? 0 : undefined}
        onKeyDown={(e) => { if (onQuickView && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onQuickView(item); } }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="bq-menu-img group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="bq-menu-img flex items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
            <span className="text-2xl">🍽️</span>
          </div>
        )}

        <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-sm z-10">
          <Tag className="w-3 h-3" /> {discountPercentage}% OFF
        </div>

        {soldOut && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">Sold Out</span>
          </div>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleWishlist(item.id); }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 right-2 bg-white/95 backdrop-blur p-2 rounded-full text-stone-600 hover:text-red-600 hover:bg-red-50 transition-all shadow-sm"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-600 text-red-600' : 'text-stone-400'}`} />
        </button>
      </div>

      <div className="mt-2.5 px-0.5 flex flex-col flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/90 line-clamp-1">{categoryLabel}</p>
        <h3
          className={`text-stone-900 font-bold text-sm sm:text-[15px] leading-snug line-clamp-1 mt-0.5 group-hover:text-amber-700 transition-colors ${onQuickView ? 'cursor-pointer' : ''}`}
          onClick={() => onQuickView?.(item)}
          role={onQuickView ? 'button' : undefined}
          tabIndex={onQuickView ? 0 : undefined}
          onKeyDown={(e) => { if (onQuickView && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onQuickView(item); } }}
        >
          {item.name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
          {item.foodType === 'veg' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-emerald-600 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /></span>
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-red-600 flex items-center justify-center"><span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600" /></span>
              Non-Veg
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2 min-h-[2.2rem]">
          {item.description || 'Special discounted offer on this dish.'}
        </p>

        <div className="mt-auto pt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="line-through text-stone-400 text-xs tabular-nums">{formatINR(originalPrice)}</span>
              <span className="text-amber-600 font-bold text-sm sm:text-base tabular-nums">{formatINR(discountedPrice)}</span>
            </div>
            <span className="inline-block mt-0.5 text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">Save {formatINR(savings)}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {soldOut ? (
              <span className="text-xs text-stone-500 font-medium px-2">Unavailable</span>
            ) : cartQuantity > 0 ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 rounded-lg p-1">
                <button onClick={() => onUpdateQuantity(item.id, cartQuantity - 1)} className="w-7 h-7 rounded-md bg-white hover:bg-stone-50 text-amber-700 flex items-center justify-center border border-amber-200/50" aria-label="Decrease quantity"><Minus className="w-3.5 h-3.5" /></button>
                <span className="w-5 text-center text-xs font-bold text-amber-800 tabular-nums">{cartQuantity}</span>
                <button onClick={() => onUpdateQuantity(item.id, cartQuantity + 1)} className="w-7 h-7 rounded-md bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center" aria-label="Increase quantity"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => onAddToCart(item)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5" /><span>Add</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const OffersPage: React.FC<OffersPageProps> = ({
  menuItems,
  cart,
  categories,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  wishlist,
  onNavigate,
  activeTable,
  onOpenTableModal,
  onOpenCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const categoryNameBySlug = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c) => { map[c.slug] = c.name; map[c.id] = c.name; });
    return map;
  }, [categories]);

  const activeOffers = useMemo(() => menuItems.filter((d) => isConfiguredOffer(d)), [menuItems]);

  const offerItems = useMemo(() => {
    let list = activeOffers;
    if (selectedCategory !== 'all') {
      const selectedCat = categories.find((c) => c.slug === selectedCategory);
      list = list.filter((d) => {
        const cat = String(d.category ?? '');
        return (
          cat === selectedCategory ||
          (selectedCat && (cat === String(selectedCat.id) || cat === selectedCat.slug))
        );
      });
    }
    return list;
  }, [activeOffers, selectedCategory, categories]);

  const searchedItems = useMemo(() => {
    if (!searchQuery.trim()) return offerItems;
    const q = searchQuery.toLowerCase().trim();
    return offerItems.filter((d) => {
      const cat = (categoryNameBySlug[d.category] || d.category || '').toLowerCase();
      return d.name.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q) || cat.includes(q);
    });
  }, [offerItems, searchQuery, categoryNameBySlug]);

  const sortedItems = useMemo(() => {
    const sorted = [...searchedItems];
    const discounted = (item: MenuItem) => Math.round(item.price * (100 - Number(item.discountPercentage || 0))) / 100;
    switch (sortBy) {
      case 'price-low': return sorted.sort((a, b) => discounted(a) - discounted(b));
      case 'price-high': return sorted.sort((a, b) => discounted(b) - discounted(a));
      case 'newest':
      default: return sorted;
    }
  }, [searchedItems, sortBy]);

  const getItemCartQty = useCallback((itemId: string) => {
    const found = cart.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  }, [cart]);

  const sidebarCategories = useMemo(() => categories.filter((c) => c.slug !== 'all'), [categories]);

  const categoryButton = (slug: string, label: string, index: number, onSelect: () => void) => {
    const isActive = selectedCategory === slug;
    return (
      <motion.button
        key={slug}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 + index * 0.03 }}
        type="button"
        onClick={onSelect}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-[#FFF3E0] text-[#B45309] font-semibold shadow-sm' : 'text-stone-700 hover:bg-amber-100/70'}`}
      >
        <img src={CATEGORY_IMAGES[slug] || CATEGORY_IMAGES.all} alt={label} className="w-7 h-7 rounded-md object-cover flex-shrink-0 ring-1 ring-amber-200/70" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = CATEGORY_IMAGES.all; }} />
        <span className="truncate">{label}</span>
      </motion.button>
    );
  };

  const sidebarContent = (onSelectDone?: () => void) => (
    <>
      <div className="p-5 border-b border-amber-200/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-xl shadow-sm">भ</div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight font-serif text-stone-900">Bhojan<span className="text-amber-700 font-sans font-extrabold">QR</span></span>
            <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">Digital Menu</span>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
        {categoryButton('all', 'All Offers', 0, () => { setSelectedCategory('all'); onSelectDone?.(); })}
        {sidebarCategories.map((cat, index) => categoryButton(cat.slug, cat.name, index + 1, () => { setSelectedCategory(cat.slug); onSelectDone?.(); }))}
      </nav>
      <div className="p-4 border-t border-amber-200/70">
        <button onClick={() => { onOpenTableModal(); onSelectDone?.(); }} className="w-full text-left px-2 py-2 text-xs text-stone-600 underline underline-offset-2 hover:text-stone-900 transition-colors">Change Table</button>
        <p className="text-[10px] text-stone-500 mt-2">Order from your table</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-stone-900 flex flex-col overflow-x-hidden">
      <div className="bg-amber-50 border-b border-amber-100 px-4 sm:px-6 lg:px-8 py-3 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="font-medium text-stone-800">Ordering directly for <strong className="text-stone-900">Table {activeTable}</strong></span>
          </div>
          <button onClick={() => onOpenTableModal()} className="text-amber-600 underline hover:text-amber-800 font-bold">Change Table</button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <aside className="w-[220px] flex-shrink-0 bg-[#FFF1E0] flex-col hidden lg:flex min-h-full">{sidebarContent()}</aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-40 bg-stone-900/40 lg:hidden" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true" />
              <motion.aside initial={{ x: -220 }} animate={{ x: 0 }} exit={{ x: -220 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed inset-y-0 left-0 z-50 w-[220px] bg-[#FFF1E0] shadow-xl lg:hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="absolute top-3 right-3">
                  <button type="button" onClick={() => setMobileSidebarOpen(false)} className="text-stone-500 hover:text-stone-800 p-1 rounded-md hover:bg-amber-100/70" aria-label="Close"><X className="w-5 h-5" /></button>
                </div>
                {sidebarContent(() => setMobileSidebarOpen(false))}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 min-w-0 overflow-y-auto bg-[#FBFBF9]">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-6 lg:hidden">
                <button type="button" onClick={() => setMobileSidebarOpen(true)} className="p-2 -ml-2 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100" aria-label="Open categories"><MenuIcon className="w-5 h-5" /></button>
                <span className="text-sm font-semibold text-stone-700">Categories</span>
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
                <div>
                  <button type="button" onClick={() => onNavigate('/')} className="flex items-center gap-2 text-amber-600 font-bold text-sm hover:text-amber-700 transition-colors"><ChevronLeft className="w-4 h-4" />Back to Home</button>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-bold font-serif text-stone-900">Special Offers</h1>
                  <p className="text-sm text-stone-500 mt-0.5">Discounted dishes from across our menu</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="relative flex-1 sm:max-w-[320px] min-w-[200px]">
                    <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search offers..." className="w-full bg-white text-stone-900 text-sm pl-10 pr-4 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-400" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 p-1 bg-stone-50 rounded-lg border border-stone-200 shrink-0">
                    <button onClick={() => setSortBy('newest')} className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${sortBy === 'newest' ? 'bg-white text-stone-900 border border-stone-200 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}>Newest</button>
                    <button onClick={() => setSortBy('price-low')} className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${sortBy === 'price-low' ? 'bg-white text-stone-900 border border-stone-200 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}>Price: Low → High</button>
                    <button onClick={() => setSortBy('price-high')} className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${sortBy === 'price-high' ? 'bg-white text-stone-900 border border-stone-200 shadow-xs' : 'text-stone-500 hover:text-stone-900'}`}>Price: High → Low</button>
                  </div>
                  <span className="text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full self-start sm:self-auto">{sortedItems.length} offer{sortedItems.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {sortedItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><Tag className="w-8 h-8" /></div>
                  <h3 className="text-base font-bold text-stone-900 mb-2">No active offers</h3>
                  <p className="text-sm text-stone-500 max-w-sm mx-auto">
                    {activeOffers.length === 0
                      ? 'No offers are currently configured. Add a discount and activate an offer for any dish in the admin dashboard.'
                      : 'No offers match the selected category or search. Try a different filter.'}
                  </p>
                </div>
              ) : (
                <div className="bq-menu-grid">
                  {sortedItems.map((item) => (
                    <div key={item.id} className="w-full min-w-0 max-w-[320px]">
                      <OfferCard
                        item={item}
                        discountPercentage={Number(item.discountPercentage || 0)}
                        cartQuantity={getItemCartQty(item.id)}
                        onAddToCart={onAddToCart}
                        onUpdateQuantity={onUpdateQuantity}
                        isWishlisted={wishlist.includes(item.id)}
                        onToggleWishlist={onToggleWishlist}
                        onQuickView={(it) => onNavigate(`/menu/${it.id}`)}
                        categoryLabel={categoryNameBySlug[item.category] || item.category}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

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
    </div>
  );
};
