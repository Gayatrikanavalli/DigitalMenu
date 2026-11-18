import React, { useRef, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, ChevronLeft, ChevronRight, UtensilsCrossed, QrCode } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { formatINR } from '../lib/storage';
import { HERO_IMAGE } from '../lib/initialData';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// Separate plated-food assets for "What's on your mind?" carousel only (not menu product images)
const MIND_CAROUSEL_IMAGES: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?q=80&w=400&auto=format&fit=crop',
  starters: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop',
  curries: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop',
  breads: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=400&auto=format&fit=crop',
  desserts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=400&auto=format&fit=crop',
  beverages: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=400&auto=format&fit=crop',
  'south-indian': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=400&auto=format&fit=crop',
  chinese: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=400&auto=format&fit=crop',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop',
  dosa: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=400&auto=format&fit=crop',
  idli: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?q=80&w=400&auto=format&fit=crop',
  salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=400&auto=format&fit=crop',
  'ice-cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400&auto=format&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop',
};

// Short display labels for "What's on your mind?" (DB category names/slugs unchanged)
const MIND_DISPLAY_LABELS: Record<string, string> = {
  biryani: 'Biryani',
  starters: 'Samosa',
  curries: 'Curries',
  breads: 'Breads',
  desserts: 'Desserts',
  beverages: 'Juices',
  'south-indian': 'South Indian',
  chinese: 'Chinese',
  burgers: 'Burgers',
  dosa: 'Dosa',
  idli: 'Idli',
  salads: 'Salad',
  pasta: 'Pasta',
  'ice-cream': 'Ice Cream',
  pizza: 'Pizza',
};

interface HomePageProps {
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
}

interface DiscountOfferCardProps {
  item: MenuItem;
  discountPercentage: number;
  cartQuantity: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}

const DiscountOfferCard: React.FC<DiscountOfferCardProps> = ({
  item,
  discountPercentage,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  isWishlisted,
  onToggleWishlist,
}) => {
  const originalPrice = item.price;
  const discountAmount = Math.round((originalPrice * discountPercentage) / 100);
  const discountedPrice = originalPrice - discountAmount;
  const savings = Math.round((discountPercentage / 100) * originalPrice);

  return (
    <div className="group relative">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-stone-50">
        {item.image ? (
          <motion.img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400">
            <span className="text-2xl">🍽️</span>
          </div>
        )}

        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter shadow-sm">
          {discountPercentage}% OFF
        </div>

        {(!item.isAvailable || item.isActive === false) && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-stone-900 font-bold text-base leading-snug line-clamp-1">{item.name}</h3>

        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1.5 flex-wrap">
          {item.foodType === 'veg' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-emerald-600 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              </span>
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-red-600 flex items-center justify-center">
                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-600" />
              </span>
              Non-Veg
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <span className="line-through text-stone-400 text-xs">{formatINR(originalPrice)}</span>
            <span className="text-amber-600 font-bold text-sm tabular-nums">{formatINR(discountedPrice)}</span>
            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Save ₹{savings}</span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => onToggleWishlist(item.id)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.9 }}
              animate={isWishlisted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.25 }}
              className="w-8 h-8 rounded-lg border border-stone-300 bg-white flex items-center justify-center hover:border-amber-500 hover:text-amber-600 transition-colors"
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-amber-500 text-amber-600' : 'text-stone-400'}`} />
            </motion.button>

            {!item.isAvailable || item.isActive === false ? (
              <span className="text-xs text-stone-500 font-medium">Unavailable</span>
            ) : cartQuantity > 0 ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-lg p-1">
                <motion.button
                  onClick={() => onUpdateQuantity(item.id, cartQuantity - 1)}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-md bg-white hover:bg-stone-50 text-amber-600 flex items-center justify-center font-bold text-sm transition-colors border border-amber-200/40"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                </motion.button>
                <span className="w-6 text-center text-xs font-bold text-amber-700 tabular-nums">{cartQuantity}</span>
                <motion.button
                  onClick={() => onUpdateQuantity(item.id, cartQuantity + 1)}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-md bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center font-bold text-sm transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => onAddToCart(item)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span>Add</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

  const MindDishImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white text-stone-300">
        <UtensilsCrossed className="w-8 h-8" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        display: 'block',
      }}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export const HomePage: React.FC<HomePageProps> = ({
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
}) => {
  const mindRef = useRef<HTMLDivElement>(null);
  const specialsRef = useRef<HTMLDivElement>(null);

  const mindCategories = useMemo(() => {
    const activeSlugs = new Set(
      menuItems.filter((m) => m.isAvailable && m.isActive !== false).map((m) => String(m.category))
    );
    return categories
      .filter((c) => c.slug !== 'all' && activeSlugs.has(c.slug))
      .map((cat) => ({
        slug: cat.slug,
        label: MIND_DISPLAY_LABELS[cat.slug] || cat.name,
        image: MIND_CAROUSEL_IMAGES[cat.slug] || menuItems.find((m) => String(m.category) === cat.slug && m.image)?.image || HERO_IMAGE,
      }));
  }, [categories, menuItems]);

  const specials = useMemo(
    () => menuItems.filter((d) => d.isSpecial && d.isAvailable && d.isActive !== false),
    [menuItems]
  );

  const offerItems = useMemo(() => {
    const OFFER_DISCOUNTS: Record<string, number> = {};
    return menuItems
      .filter((d) => d.isAvailable && d.isActive !== false)
      .filter((d) => {
        const disc = OFFER_DISCOUNTS[d.id];
        return disc !== undefined && disc > 0;
      })
      .map((d) => ({ item: d, discountPercentage: OFFER_DISCOUNTS[d.id]! }));
  }, [menuItems]);

  const getItemCartQty = (itemId: string) => {
    const found = cart.find((ci) => ci.menuItem.id === itemId);
    return found ? found.quantity : 0;
  };

  const scrollBy = (ref: React.RefObject<HTMLDivElement>, delta: number) => {
    if (ref.current) ref.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const renderSpecialCard = (dish: MenuItem) => {
    const isSoldOut = !dish.isAvailable || dish.isActive === false;
    const cartQuantity = getItemCartQty(dish.id);
    const isWishlisted = wishlist.includes(dish.id);
    return (
      <motion.div
        key={dish.id}
        variants={fadeUp}
        whileHover={{ y: -6, transition: { duration: 0.25 } }}
        className="group w-full min-w-0"
      >
        <div className="relative overflow-hidden rounded-xl bg-stone-100">
          {dish.image ? (
            <motion.img
              src={dish.image}
              alt={dish.name}
              className="w-full h-[158px] sm:h-[158px] object-cover rounded-xl block"
              style={{ aspectRatio: '1.7 / 1', height: 'auto', width: '100%' }}
              loading="lazy"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/src/assets/images/bhojan_dum_biryani_1792839056384.jpg';
              }}
            />
          ) : (
            <div className="w-full rounded-xl bg-stone-100 flex items-center justify-center text-stone-400" style={{ aspectRatio: '1.7 / 1' }}>
              <span className="text-2xl">🍽️</span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
              <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">Sold Out</span>
            </div>
          )}
        </div>
        <div className="mt-2">
          <h3 className="text-stone-900 font-bold text-base leading-snug line-clamp-1">{dish.name}</h3>
          <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2">{dish.description}</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-amber-600 font-bold text-base tabular-nums">{formatINR(dish.price)}</span>
            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={() => onToggleWishlist(dish.id)}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                animate={isWishlisted ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-lg border border-stone-300 bg-white flex items-center justify-center hover:border-amber-500 hover:text-amber-600 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-amber-500 text-amber-600' : 'text-stone-400'}`} />
              </motion.button>
              {isSoldOut ? (
                <span className="text-xs text-stone-500 font-medium">Unavailable</span>
              ) : cartQuantity > 0 ? (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-lg p-1">
                  <motion.button
                    onClick={() => onUpdateQuantity(dish.id, cartQuantity - 1)}
                    whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 rounded-md bg-white hover:bg-stone-50 text-amber-600 flex items-center justify-center font-bold text-sm transition-colors border border-amber-200/40"
                    aria-label="Decrease quantity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </motion.button>
                  <span className="w-6 text-center text-xs font-bold text-amber-700 tabular-nums">{cartQuantity}</span>
                  <motion.button
                    onClick={() => onUpdateQuantity(dish.id, cartQuantity + 1)}
                    whileTap={{ scale: 0.9 }}
                    className="w-7 h-7 rounded-md bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center font-bold text-sm transition-colors"
                    aria-label="Increase quantity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => onAddToCart(dish)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span>Add</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-white text-stone-900 flex flex-col"
    >
      <main className="flex-1">
        {/* Hero Banner */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6"
        >
          <motion.div variants={fadeUp} className="relative w-full min-h-[280px] sm:min-h-[340px] lg:min-h-[380px] rounded-2xl overflow-hidden">
            <motion.img
              src={HERO_IMAGE}
              alt="Delicious restaurant dishes"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ scale: 1.06, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/20" />
            <div className="relative z-10 h-full min-h-[280px] sm:min-h-[340px] lg:min-h-[380px] flex flex-col justify-center px-6 sm:px-10 lg:px-14 max-w-2xl">
              <motion.h1 variants={fadeUp} className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-white leading-tight">
                Order Delicious Food Online
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-3 sm:mt-4 text-sm sm:text-base text-stone-100/90 max-w-xl">
                Discover delicious flavours and order your favourite dishes.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-6 sm:mt-8 flex flex-wrap gap-3">
                <motion.button
                  type="button"
                  onClick={() => onNavigate('menu')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm shadow-sm transition-colors"
                >
                  Explore Menu
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => onNavigate('menu')}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/95 hover:bg-white text-stone-900 font-semibold text-sm border border-white/60 transition-colors"
                >
                  Order Now
                </motion.button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-4 sm:mt-5">
                <button
                  type="button"
                  onClick={onOpenTableModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-stone-800 text-sm font-medium border border-white/60 shadow-sm backdrop-blur-sm transition-colors"
                >
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>Table <span className="font-semibold text-stone-900">{activeTable}</span></span>
                  <span className="text-stone-400">·</span>
                  <span className="text-amber-700 font-semibold">Scan QR / Change Table</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {/* What's on your mind */}
        {mindCategories.length > 0 && (
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12"
          >
            <div className="flex items-center justify-between mb-5">
              <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">What&apos;s on your mind?</motion.h2>
              <div className="hidden sm:flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => scrollBy(mindRef, -320)}
                  aria-label="Scroll left"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => scrollBy(mindRef, 320)}
                  aria-label="Scroll right"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
            <div className="relative">
              <motion.div
                ref={mindRef}
                variants={staggerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                className="flex gap-6 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth pb-2 snap-x snap-mandatory"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {mindCategories.map((cat) => (
                  <motion.button
                    key={cat.slug}
                    type="button"
                    variants={fadeUp}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onNavigate('menu', cat.slug)}
                    className="flex-shrink-0 flex flex-col items-center w-24 sm:w-28 snap-start focus:outline-none group"
                  >
                    <motion.div
                      className="flex items-center justify-center bg-white"
                      style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden' }}
                      whileHover={{ scale: 1.06 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <MindDishImage src={cat.image} alt={cat.label} />
                    </motion.div>
                    <motion.span
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35 }}
                      className="mt-3 text-xs sm:text-sm font-medium text-stone-700 text-center leading-snug line-clamp-2 group-hover:text-amber-700"
                    >
                      {cat.label}
                    </motion.span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* Today's Chef Specials (preserved) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={fadeUp}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-16"
        >
          {specials.length > 0 && (
            <motion.section variants={stagger} className="mb-10 sm:mb-12 relative">
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold uppercase tracking-[0.25em] mb-2">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Today&apos;s Chef Specials</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">Today&apos;s Chef Specials</h2>
                  <p className="text-sm text-stone-500 mt-1">Handpicked by our culinary team</p>
                </div>
                {specials.length > 3 && (
                  <div className="hidden sm:flex items-center gap-2">
                    <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => scrollBy(specialsRef, -340)} aria-label="Scroll left" className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center shadow-sm"><ChevronLeft className="w-5 h-5" /></motion.button>
                    <motion.button type="button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={() => scrollBy(specialsRef, 340)} aria-label="Scroll right" className="w-10 h-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center shadow-sm"><ChevronRight className="w-5 h-5" /></motion.button>
                  </div>
                )}
              </motion.div>
              <div className="relative">
                <motion.div
                  ref={specialsRef}
                  variants={staggerFast}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8 scroll-smooth"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {specials.map((dish) => (
                    <div key={dish.id} className="shrink-0 w-[250px] sm:w-[280px] lg:w-[300px] snap-start">
                      {renderSpecialCard(dish)}
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* Offers Preview (preserved behavior when configured) */}
          {offerItems.length > 0 && (
            <motion.section
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              variants={stagger}
              className="relative mb-10 sm:mb-12"
            >
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 font-bold uppercase tracking-[0.25em] mb-2">
                    <span>Special Offers</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 leading-tight">Today&apos;s Offers</h2>
                  <p className="text-sm text-stone-500 mt-1">Limited-time discounts on select dishes</p>
                </div>
                <motion.button whileHover={{ x: 3 }} onClick={() => onNavigate('offers')} className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors whitespace-nowrap">View All →</motion.button>
              </motion.div>
              <motion.div variants={staggerFast} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-8 scroll-smooth">
                {offerItems.map(({ item, discountPercentage }) => (
                  <motion.div key={item.id} variants={fadeUp} whileHover={{ y: -6 }} className="shrink-0 w-[250px] sm:w-[280px] lg:w-[300px]">
                    <DiscountOfferCard
                      item={item}
                      discountPercentage={discountPercentage}
                      cartQuantity={getItemCartQty(item.id)}
                      onAddToCart={onAddToCart}
                      onUpdateQuantity={onUpdateQuantity}
                      isWishlisted={wishlist.includes(item.id)}
                      onToggleWishlist={onToggleWishlist}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.section>
          )}
        </motion.div>
      </main>

      {/* Footer (preserved) */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeUp}
        className="mt-auto border-t border-stone-100 bg-white"
      >
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
              <p className="text-sm text-stone-600 leading-relaxed">
                Celebrating the royal heritage of slow dum cooking, charcoal tandoor roasts, and time-honored Mughlai recipes — served straight to your table.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Quick Links</h4>
              <ul className="space-y-2 text-sm text-stone-600">
                <li><button onClick={() => onNavigate('menu')} className="w-full text-left hover:text-amber-600 transition-colors">Menu</button></li>
                <li><button onClick={() => onNavigate('offers')} className="w-full text-left hover:text-amber-600 transition-colors">Offers</button></li>
                <li><button onClick={() => onNavigate('about')} className="w-full text-left hover:text-amber-600 transition-colors">About</button></li>
                <li><button onClick={() => onNavigate('contact')} className="w-full text-left hover:text-amber-600 transition-colors">Contact</button></li>
                <li><button onClick={() => onOpenCart()} className="w-full text-left hover:text-amber-600 transition-colors">My Order</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-stone-200 text-xs text-stone-500">© {new Date().getFullYear()} BhojanQR. All rights reserved.</div>
        </div>
      </motion.footer>
    </motion.div>
  );
};
