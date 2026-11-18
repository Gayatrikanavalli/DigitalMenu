import React from 'react';
import { motion } from 'framer-motion';
import { MenuItem } from '../types';
import { formatINR } from '../lib/storage';
import { Plus, Minus, Clock, UtensilsCrossed, Heart } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onQuickView?: (item: MenuItem) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (itemId: string) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onQuickView,
  isWishlisted = false,
  onToggleWishlist,
}) => {
  const isSoldOut = !item.isAvailable || item.isActive === false;

  return (
    <motion.div
      className="group w-full min-w-0"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4 }}
      whileTap={{ y: 0 }}
    >
      <div
        className="bq-menu-img-wrapper relative w-full overflow-hidden rounded-xl cursor-pointer"
        onClick={() => onQuickView?.(item)}
        role={onQuickView ? 'button' : undefined}
        tabIndex={onQuickView ? 0 : undefined}
        onKeyDown={(e) => { if (onQuickView && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onQuickView(item); } }}
      >
        {item.image ? (
          <motion.img
            src={item.image}
            alt={item.name}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.dataset.fallbackApplied) return;
              img.dataset.fallbackApplied = '1';
              img.style.display = 'none';
              img.parentElement?.querySelector('.bq-menu-img-fallback')?.classList.remove('hidden');
            }}
            className="bq-menu-img"
            loading="eager"
            decoding="async"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
        <div className={`bq-menu-img bq-menu-img-fallback flex flex-col items-center justify-center bg-stone-100 text-stone-400 ${item.image ? 'hidden' : ''}`}>
          <UtensilsCrossed className="w-8 h-8 text-amber-400 mb-2" />
          <span className="text-xs font-medium text-stone-500 text-center px-2">{item.name}</span>
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <h3
          className={`text-stone-900 font-bold text-base leading-snug line-clamp-1 ${onQuickView ? 'cursor-pointer hover:text-amber-700 transition-colors' : ''}`}
          onClick={() => onQuickView?.(item)}
        >
          {item.name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-stone-500 mt-1 flex-wrap">
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

          {item.preparationTimeMins && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span className="text-stone-600">{item.preparationTimeMins} mins</span>
            </span>
          )}

          {item.spiciness && (
            <span className="capitalize text-stone-600">{item.spiciness} Spice</span>
          )}
        </div>

        <p className="mt-1 text-xs text-stone-500 leading-relaxed line-clamp-2">
          {item.description}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-amber-600 font-bold text-base tabular-nums">
            {formatINR(item.price)}
          </span>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleWishlist?.(item.id); }}
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
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, cartQuantity - 1); }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-md bg-white hover:bg-stone-50 text-amber-600 flex items-center justify-center font-bold text-sm transition-colors border border-amber-200/40"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </motion.button>
                <span className="w-6 text-center text-xs font-bold text-amber-700 tabular-nums">
                  {cartQuantity}
                </span>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, cartQuantity + 1); }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 rounded-md bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center font-bold text-sm transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={(e) => { e.stopPropagation(); onAddToCart(item); }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};