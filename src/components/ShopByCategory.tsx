import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface ShopByCategoryProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=400&auto=format&fit=crop',
  starters: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop',
  curries: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop',
  breads: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=400&auto=format&fit=crop',
  desserts: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?q=80&w=400&auto=format&fit=crop',
  beverages: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=400&auto=format&fit=crop',
  'south-indian': 'https://images.unsplash.com/photo-1612874742237-652622190843?q=80&w=400&auto=format&fit=crop',
  chinese: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=400&auto=format&fit=crop',
  burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop',
  dosa: 'https://images.unsplash.com/photo-1751560455942-f859f1215826?q=80&w=400&auto=format&fit=crop',
  idli: 'https://images.unsplash.com/photo-1603894574373-67ac1862a0c9?q=80&w=400&auto=format&fit=crop',
  salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?q=80&w=400&auto=format&fit=crop',
  'ice-cream': 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?q=80&w=400&auto=format&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop',
  all: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop',
};

export const ShopByCategory: React.FC<ShopByCategoryProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <section className="bg-white py-12 sm:py-16 border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 sm:mb-10">
          <div>
            <h2 className="text-3xl font-serif font-bold text-stone-900 tracking-tight mb-1">
              Shop by Category
            </h2>
            <p className="text-sm text-stone-500">Choose your favorite cuisine</p>
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
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:pb-6"
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            const img = CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES.all;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`shrink-0 w-[150px] sm:w-[170px] rounded-2xl overflow-hidden border flex flex-col transition-all ${
                  isActive
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-md'
                }`}
                aria-pressed={isActive}
              >
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-stone-100">
                  <img
                    src={img}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-amber-600/20 flex items-end justify-end p-2">
                      <svg className="w-5 h-5 text-amber-600 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col items-center text-center gap-1">
                  <span className="text-sm font-medium text-stone-900 group-hover:text-amber-600 transition-colors leading-tight">
                    {cat.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
