import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onExploreMenu: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExploreMenu }) => {
  return (
    <section className="relative overflow-hidden bg-white text-stone-900">
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80')" }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/90 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl">
          <p className="text-amber-600 uppercase tracking-[0.3em] text-xs font-bold mb-4">
            BhojanQR
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-4">
            Premium Dining,
            <span className="text-amber-600"> Seamless Ordering</span>
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mb-8 max-w-xl">
            Discover our curated menu, order from your table, and track your meal in real time.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExploreMenu}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              Explore Menu
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreMenu}
              className="px-6 py-3 border border-amber-600 text-amber-600 hover:bg-amber-50 font-bold rounded-lg transition-colors"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
