import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HomeHeroProps {
  onExploreMenu: () => void;
  activeTable: string;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ onExploreMenu, activeTable }) => {
  const benefits = [
    { title: 'Freshly Prepared', desc: 'Cooked to order daily' },
    { title: 'Quality Ingredients', desc: 'Premium & authentic produce' },
    { title: 'Easy QR Ordering', desc: 'Scan & order from your table' },
    { title: 'Fast Service', desc: 'Quick kitchen turnaround' },
  ];

  return (
    <section className="relative overflow-hidden bg-white text-stone-900">
      {/* Hero background */}
      <div className="absolute inset-0 z-0 opacity-12" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80')" }} />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/85 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-40 z-20">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4 block">
            Premium Indian Cuisine
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight text-stone-900 mb-6">
            Discover the Taste of<br />
            <span className="text-amber-600">Excellence</span>
          </h1>
          <p className="text-stone-600 text-base sm:text-lg mb-8 max-w-xl leading-relaxed">
            Authentic Indian flavors, hand-crafted daily with fresh ingredients and slow-dum cooking. Scan your table QR to browse and order seamlessly.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onExploreMenu}
              className="px-7 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm shadow-amber-500/30 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Explore Menu
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => { /* order now - opens cart flow */ }}
              className="px-7 py-3.5 border border-stone-200 bg-white text-stone-700 font-bold rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Order Now
            </button>
          </div>
        </div>
      </div>

      {/* Benefits strip */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="p-5 rounded-xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-2">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{b.title}</span>
              <span className="text-sm text-stone-600">{b.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table info note */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <span className="text-sm font-semibold text-stone-900">Serving at Table</span>
            <p className="text-xs text-amber-700 font-bold">{activeTable}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
