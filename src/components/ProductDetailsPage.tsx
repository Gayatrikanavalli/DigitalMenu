import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flame, Heart, Leaf, Minus, Plus, ShoppingBag, Star, Tag, UtensilsCrossed, Info } from 'lucide-react';
import { Category, MenuItem } from '../types';
import { formatINR } from '../lib/storage';
import { api } from '../lib/api';

interface ProductDetailsPageProps {
  productId: string;
  menuItems: MenuItem[];
  categories: Category[];
  cart: { menuItem: MenuItem; quantity: number }[];
  wishlist: string[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onToggleWishlist: (id: string) => void;
  onNavigate: (view: string, category?: string) => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  productId,
  menuItems,
  categories,
  cart,
  wishlist,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onNavigate,
}) => {
  const cached = useMemo(
    () => menuItems.find((m) => String(m.id) === String(productId)) || null,
    [menuItems, productId]
  );
  const [item, setItem] = useState<MenuItem | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    if (cached) {
      setItem(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    (async () => {
      try {
        const fetched = await api.menu.get(productId);
        if (!mounted) return;
        if (fetched) {
          setItem(fetched);
        } else if (!cached) {
          setItem(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        if (!cached) setError(e?.message || 'Failed to load product details.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId, cached]);

  const categoryName = useMemo(() => {
    if (!item) return '';
    const cat = categories.find((c) => c.slug === item.category || c.id === item.category);
    return cat?.name || String(item.category || 'Menu');
  }, [categories, item]);

  const cartQty = item ? (cart.find((c) => c.menuItem.id === item.id)?.quantity || 0) : 0;
  const isWishlisted = item ? wishlist.includes(item.id) : false;
  const isSoldOut = !!item && (!item.isAvailable || item.isActive === false);
  const discount = item?.discountPercentage && item.discountPercentage > 0 ? item.discountPercentage : 0;
  const originalPrice = item ? item.price : 0;
  const currentPrice = discount ? Math.max(0, Math.round(originalPrice * (100 - discount)) / 100) : originalPrice;

  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) window.history.back();
    else onNavigate('/menu');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafb]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-amber-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-8 animate-pulse">
            <div className="aspect-[4/3] rounded-2xl bg-stone-200 max-w-md w-full mx-auto lg:mx-0" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-stone-200 rounded" />
              <div className="h-8 w-3/4 bg-stone-200 rounded" />
              <div className="h-6 w-40 bg-stone-200 rounded" />
              <div className="h-24 w-full bg-stone-200 rounded" />
              <div className="h-12 w-48 bg-stone-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#fafafb]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={goBack} className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-amber-700 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to menu
          </button>
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">{error ? 'Unable to load product' : 'Product unavailable'}</h1>
            <p className="text-sm text-stone-600 mb-6">{error || 'This dish could not be found or is no longer available.'}</p>
            <button onClick={() => onNavigate('/menu')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm">
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rating = typeof item.rating === 'number' ? item.rating : null;
  const reviewCount = typeof item.reviewCount === 'number' ? item.reviewCount : 0;

  const detailRows: { label: string; value: string }[] = [];
  detailRows.push({ label: 'Category', value: categoryName });
  detailRows.push({ label: 'Food type', value: item.foodType === 'veg' ? 'Vegetarian' : 'Non-vegetarian' });
  detailRows.push({ label: 'Availability', value: isSoldOut ? 'Currently unavailable' : 'In stock' });
  if (item.preparationTimeMins) detailRows.push({ label: 'Preparation time', value: `${item.preparationTimeMins} minutes` });
  if (item.spiciness) detailRows.push({ label: 'Spice level', value: `${item.spiciness.charAt(0).toUpperCase()}${item.spiciness.slice(1)}` });
  if (item.isSpecial) detailRows.push({ label: 'Highlight', value: "Chef's Special" });
  else if (item.isPopular) detailRows.push({ label: 'Highlight', value: 'Popular choice' });
  if (discount > 0) detailRows.push({ label: 'Offer', value: `${discount}% off` });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#fafafb]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.button
          onClick={goBack}
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-amber-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_1fr] xl:grid-cols-[minmax(0,440px)_1fr] gap-0 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 sm:p-6 lg:p-8 bg-stone-50/60 border-b lg:border-b-0 lg:border-r border-stone-200"
            >
              <div className="w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] mx-auto">
                <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-stone-200 flex items-center justify-center">
                  {item.image ? (
                    <motion.img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        img.parentElement?.querySelector('.bq-detail-fallback')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`bq-detail-fallback w-full h-full flex flex-col items-center justify-center text-stone-400 bg-stone-100 ${item.image ? 'hidden' : ''}`}>
                    <UtensilsCrossed className="w-12 h-12 text-amber-400 mb-2" />
                    <span className="text-sm font-medium text-stone-500 px-4 text-center">{item.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="p-5 sm:p-7 lg:p-8 xl:p-10 flex flex-col min-w-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">{categoryName}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif leading-tight">{item.name}</h1>
                </div>
                <motion.button
                  type="button"
                  onClick={() => onToggleWishlist(item.id)}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  animate={isWishlisted ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="w-10 h-10 rounded-full border border-stone-200 bg-white flex items-center justify-center hover:border-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-amber-500 text-amber-600' : 'text-stone-400'}`} />
                </motion.button>
              </div>

              <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
                <span className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums">{formatINR(currentPrice)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-base text-stone-400 line-through tabular-nums">{formatINR(originalPrice)}</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold">
                      <Tag className="w-3 h-3" /> {discount}% OFF
                    </span>
                  </>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${item.foodType === 'veg' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  <Leaf className="w-3.5 h-3.5" /> {item.foodType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                </span>
                {item.preparationTimeMins ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                    <Clock className="w-3.5 h-3.5" /> {item.preparationTimeMins} mins
                  </span>
                ) : null}
                {item.spiciness ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 capitalize">
                    <Flame className="w-3.5 h-3.5" /> {item.spiciness} spice
                  </span>
                ) : null}
                {(item.isSpecial || item.isPopular) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Star className="w-3.5 h-3.5" /> {item.isSpecial ? "Chef's Special" : 'Popular'}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                {isSoldOut ? (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-sm font-semibold border border-stone-200">Currently unavailable</span>
                ) : (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-200">In stock</span>
                )}
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-2">About this dish</h2>
                <p className="text-sm sm:text-base text-stone-600 leading-7 whitespace-pre-line">
                  {item.description || 'No description available for this dish.'}
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600" /> Dish details
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {detailRows.map((row) => (
                    <div key={row.label} className="flex flex-col">
                      <dt className="text-stone-500">{row.label}</dt>
                      <dd className="font-medium text-stone-800 mt-0.5">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100">
                {isSoldOut ? (
                  <button disabled className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-stone-200 text-stone-500 font-bold cursor-not-allowed">
                    Unavailable
                  </button>
                ) : cartQty > 0 ? (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-1.5">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onUpdateQuantity(item.id, cartQty - 1)} className="w-10 h-10 rounded-lg bg-white hover:bg-stone-50 text-amber-700 flex items-center justify-center border border-amber-200" aria-label="Decrease quantity"><Minus className="w-4 h-4" /></motion.button>
                      <span className="w-8 text-center font-bold text-amber-800 tabular-nums">{cartQty}</span>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onUpdateQuantity(item.id, cartQty + 1)} className="w-10 h-10 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center" aria-label="Increase quantity"><Plus className="w-4 h-4" /></motion.button>
                    </div>
                    <span className="text-sm text-stone-600">Added to cart</span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAddToCart(item)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold shadow-sm transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5" /> Add to Cart
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="mt-8 bg-white border border-stone-200 rounded-2xl shadow-sm p-5 sm:p-6 lg:p-8"
        >
          <h2 className="text-xl font-bold text-stone-900 font-serif mb-4">Customer Reviews</h2>
          {rating ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-bold text-stone-900">{rating.toFixed(1)}</div>
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-amber-500' : 'text-stone-300'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-stone-500 mt-0.5">{reviewCount > 0 ? `${reviewCount} ratings` : 'Ratings'}</p>
                </div>
              </div>
              <div className="text-sm text-stone-600">Customers enjoy this dish for its taste and quality. Detailed written reviews are not available yet.</div>
            </div>
          ) : (
            <div className="text-sm text-stone-600 bg-stone-50 border border-stone-200 rounded-xl p-4">
              No customer reviews yet. Be the first to try this dish and share your experience.
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
