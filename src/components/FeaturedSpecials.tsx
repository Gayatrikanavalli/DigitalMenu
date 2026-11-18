import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuItem } from '../types';
import { formatINR } from '../lib/storage';

interface FeaturedSpecialsProps {
  dishes: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onToggleWishlist?: (id: string) => void;
  wishlist?: string[];
  title?: string;
  subtitle?: string;
}

interface CardProps {
  dish: MenuItem;
  isWishlisted?: boolean;
  onAddToCart: (item: MenuItem) => void;
  onToggleWishlist?: (id: string) => void;
}

const Card: React.FC<CardProps> = ({
  dish,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
}) => {
  return (
    <div className="shrink-0 w-[240px] sm:w-[260px] lg:w-[270px] group relative">
      {/* Image */}
      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-stone-50 relative">
        {dish.image ? (
          <img
            src={dish.image}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-stone-100 text-stone-300">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-stone-700 border border-stone-200">
          {dish.preparationTimeMins} mins
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(dish.id);
          }}
          className="absolute top-2 left-2 bg-white/90 backdrop-blur p-2 rounded-full shadow-sm"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-stone-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={isWishlisted ? 3 : 2}
          >
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {(!dish.isAvailable || dish.isActive === false) && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm z-10">
            <span className="text-xs font-bold text-stone-600 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">Sold Out</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {dish.foodType === 'veg' ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[10px]">
              <span className="w-2.5 h-2.5 rounded-[2px] border border-emerald-600 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-emerald-600" />
              </span>
              Veg
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-[10px]">
              <span className="w-2.5 h-2.5 rounded-[2px] border border-red-600 flex items-center justify-center">
                <span className="w-0 h-0 border-l-[2px] border-l-transparent border-r-[2px] border-r-transparent border-b-[3px] border-b-red-600" />
              </span>
              Non-Veg
            </span>
          )}
          <span className="ml-auto text-xs text-stone-400">{dish.rating} ★</span>
        </div>
        <h3 className="text-stone-900 font-bold text-base leading-tight line-clamp-2 group-hover:text-amber-600 transition-colors">
          {dish.name}
        </h3>
        <p className="text-stone-500 text-xs line-clamp-1 mt-1">{dish.description}</p>
        <div className="mt-2 flex items-center justify-between pt-2 border-t border-stone-100">
          <span className="text-amber-600 font-bold text-sm tabular-nums">{formatINR(dish.price)}</span>
          <button
            onClick={() => {
              if (!dish.isAvailable || dish.isActive === false) return;
              onAddToCart(dish);
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-md shadow-sm transition-colors shrink-0 whitespace-nowrap"
            disabled={!dish.isAvailable || dish.isActive === false}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export const FeaturedSpecials: React.FC<FeaturedSpecialsProps> = ({
  dishes,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  title = "Today's Specials",
  subtitle,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const featured = dishes.slice(0, 8);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (featured.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16 border-y border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mb-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-stone-500">{subtitle}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-100 shadow-sm transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-10 h-10 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-100 shadow-sm transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
          {featured.map((dish) => (
            <Card
              key={dish.id}
              dish={dish}
              isWishlisted={wishlist?.includes(dish.id) || false}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
