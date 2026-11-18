import React from 'react';
import {
  UtensilsCrossed,
  Flame,
  Sparkles,
  Soup,
  Wheat,
  Cookie,
  Coffee,
} from 'lucide-react';

interface CategoryCarouselProps {
  categories: { id: string; name: string; slug: string; icon: string }[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  biryani: Flame,
  starters: Sparkles,
  curries: Soup,
  breads: Wheat,
  desserts: Cookie,
  beverages: Coffee,
  default: UtensilsCrossed,
};

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const getCategoryIcon = (slug: string) => {
    const Icon = CATEGORY_ICONS[slug] || CATEGORY_ICONS.default;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <aside className="w-72 bg-white border-r border-stone-200 flex flex-col hidden lg:flex">
      {/* Logo / branding at top of sidebar */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-amber-500/40">
            भ
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight font-serif text-stone-900">
              Bhojan<span className="text-amber-600 font-sans font-extrabold">QR</span>
            </span>
            <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
              Digital Menu
            </span>
          </div>
        </div>
      </div>

      {/* Vertical Category Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
        <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-3">
          Categories
        </h2>
        <ul className="space-y-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            const Icon = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS.default;
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => onSelectCategory(cat.slug)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-50 text-stone-900 border border-amber-200 font-semibold shadow-sm'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <div className="shrink-0">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
                  </div>
                  <span className={isActive ? 'font-bold' : 'font-medium'}>{cat.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-stone-100 bg-stone-50">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600">
            <UtensilsCrossed className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold text-stone-700">BhojanQR Kitchen</span>
        </div>
        <p className="text-[10px] text-stone-400 mt-1 text-center">
          Order from your table — no registration needed
        </p>
      </div>
    </aside>
  );
};
