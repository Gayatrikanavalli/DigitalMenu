import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MenuItem } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatINR } from '../lib/storage';

interface DishCarouselProps {
  dishes: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export const DishCarousel: React.FC<DishCarouselProps> = ({ dishes, onAddToCart }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const featured = dishes.slice(0, 10);

  const scroll = (dir: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (featured.length === 0) return null;

  return (
    <section className="bg-[#0B0B0B] py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-white">Featured Dishes</h2>
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} className="p-2 rounded-lg bg-[#181818] border border-amber-900/30 text-amber-400 hover:bg-amber-500/10">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => scroll(1)} className="p-2 rounded-lg bg-[#181818] border border-amber-900/30 text-amber-400 hover:bg-amber-500/10">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
        >
          {featured.map((dish, i) => (
            <motion.div
              key={dish.id}
              className="snap-start shrink-0 w-[260px] sm:w-[280px]"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={reduced ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } : cardVariants}
            >
              <motion.div
                className="bg-[#181818] rounded-2xl border border-amber-900/30 overflow-hidden h-full flex flex-col items-center pt-6 pb-4 px-4"
                whileHover={reduced ? {} : { y: -6, scale: 1.015 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="relative shrink-0 w-[130px] h-[130px] sm:w-[160px] sm:h-[160px]">
                  {!reduced && (
                    <motion.div
                      className="absolute inset-[-5px] rounded-full pointer-events-none"
                      style={{
                        background:
                          'conic-gradient(from 0deg, rgba(245,158,11,0.0) 0deg, rgba(245,158,11,0.55) 70deg, rgba(251,191,36,0.85) 110deg, rgba(245,158,11,0.0) 180deg, rgba(245,158,11,0.0) 360deg)',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <div
                    className="relative w-full h-full overflow-hidden border-2 border-amber-500/60 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
                    style={{ aspectRatio: '1 / 1', borderRadius: '50%' }}
                  >
                    <motion.img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full"
                      style={{ aspectRatio: '1 / 1', borderRadius: '50%', objectFit: 'cover' }}
                      loading="lazy"
                      whileHover={reduced ? {} : { scale: 1.08 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    {!reduced && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                          borderRadius: '50%',
                        }}
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                </div>
                <div className="p-4 w-full text-center">
                  <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">{dish.name}</h3>
                  <p className="text-stone-400 text-xs line-clamp-2 mb-2">{dish.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold">{formatINR(dish.price)}</span>
                    <motion.button
                      whileHover={reduced ? {} : { scale: 1.06 }}
                      whileTap={reduced ? {} : { scale: 0.95 }}
                      onClick={() => onAddToCart(dish)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};