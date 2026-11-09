import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryCarouselProps {
  onSelectCategory: (slug: string) => void;
}

interface CatItem {
  name: string;
  slug: string;
  img: string;
}

const ITEMS: CatItem[] = [
  { name: 'Dum Biryani', slug: 'biryani', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80' },
  { name: 'Breads & Naan', slug: 'breads', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=300&q=80' },
  { name: 'Royal Desserts', slug: 'desserts', img: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=300&q=80' },
  { name: 'Coffee & Beverages', slug: 'beverages', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80' },
  { name: 'Starters & Tandoor', slug: 'starters', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80' },
  { name: 'Indian Meals', slug: 'curries', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=300&q=80' },
  { name: 'South Indian Specials', slug: 'south-indian', img: 'https://images.unsplash.com/photo-1612874742237-652622190843?auto=format&fit=crop&w=300&q=80' },
  { name: 'Chinese Specials', slug: 'chinese', img: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=300&q=80' },
  { name: 'Burgers', slug: 'burgers', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
  { name: 'Dosa', slug: 'dosa', img: 'https://images.unsplash.com/photo-1751560455942-f859f1215826?q=80&w=1966&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D' },
  { name: 'Idli', slug: 'idli', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80' },
  { name: 'Fresh Salads', slug: 'salads', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80' },
  { name: 'Pasta', slug: 'pasta', img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=300&q=80' },
  { name: 'Ice Cream', slug: 'ice-cream', img: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=300&q=80' },
  { name: 'Pizza', slug: 'pizza', img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=300&q=80' },
];

const ITEM_W = 148;

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({ onSelectCategory }) => {
  const reduced = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const updateCanScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScroll(el.scrollWidth > el.clientWidth + 4);
  };

  useEffect(() => {
    updateCanScroll();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateCanScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollByAmount = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * (ITEM_W + 24), behavior: 'smooth' });
  };

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: ITEM_W + 24, behavior: 'smooth' });
      }
    }, 3200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="bg-[#0B0B0B] py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-white">Featured Categories</h2>
          {canScroll && (
            <div className="flex gap-2">
              <button onClick={() => scrollByAmount(-1)} className="p-2 rounded-lg bg-[#181818] border border-amber-900/30 text-amber-400 hover:bg-amber-500/10">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollByAmount(1)} className="p-2 rounded-lg bg-[#181818] border border-amber-900/30 text-amber-400 hover:bg-amber-500/10">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div
          ref={scrollRef}
          className="w-full overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth"
        >
          <div className="flex gap-6 px-2 py-2">
            {ITEMS.map((item) => (
              <motion.div
                key={item.slug}
                className="shrink-0 w-[112px] sm:w-[120px] flex flex-col items-center gap-2 snap-start"
                whileHover={reduced ? {} : { y: -4, scale: 1.04 }}
                transition={{ duration: 0.2 }}
                onClick={() => onSelectCategory(item.slug)}
              >
                <div className="relative w-[104px] h-[104px] sm:w-[112px] sm:h-[112px] rounded-full overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_0_14px_rgba(212,175,55,0.25)] cursor-pointer">
                  <img
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'; }}
                  />
                </div>
                <span className="text-xs text-stone-200 text-center font-medium leading-tight">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};