import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { formatINR } from '../lib/storage';
import { Plus, Minus, Clock, UtensilsCrossed } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onQuickView?: (item: MenuItem) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const [hasFailed, setHasFailed] = useState(!item.image);

  useEffect(() => {
    setHasFailed(!item.image);
  }, [item.image]);

  return (
    <div className="group">
      {/* Landscape image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-stone-900">
        {item.image && !hasFailed ? (
          <img
            src={item.image}
            alt={item.name}
            onError={() => setHasFailed(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-stone-100 text-stone-400">
            <UtensilsCrossed className="w-8 h-8 text-amber-400 mb-2" />
            <span className="text-xs font-medium text-stone-500">{item.name}</span>
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs text-white font-bold bg-stone-900/80 px-3 py-1 rounded-lg">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="text-white font-bold text-base leading-snug line-clamp-1">{item.name}</h3>

        <div className="flex items-center gap-2 text-xs text-stone-400 mt-1.5 flex-wrap">
          {item.foodType === 'veg' ? (
            <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-emerald-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-[11px]">
              <span className="w-3 h-3 rounded-[2px] border border-red-500 flex items-center justify-center">
                <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-500" />
              </span>
              Non-Veg
            </span>
          )}

          {item.preparationTimeMins && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.preparationTimeMins} mins
            </span>
          )}

          {item.spiciness && (
            <span className="capitalize">{item.spiciness} Spice</span>
          )}
        </div>

        <p className="mt-1.5 text-xs text-stone-400 leading-relaxed line-clamp-2">
          {item.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-amber-400 font-bold text-base tabular-nums">
            {formatINR(item.price)}
          </span>

          {!item.isAvailable ? (
            <span className="text-xs text-stone-500 font-medium">Unavailable</span>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-lg p-1">
              <button
                onClick={() => onUpdateQuantity(item.id, cartQuantity - 1)}
                className="w-7 h-7 rounded-md bg-[#181818] hover:bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-amber-300 tabular-nums">
                {cartQuantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.id, cartQuantity + 1)}
                className="w-7 h-7 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-900 flex items-center justify-center font-bold text-sm transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-900 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};