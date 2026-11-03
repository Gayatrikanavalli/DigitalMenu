import React from 'react';
import { Category, FoodType } from '../types';
import { 
  UtensilsCrossed, 
  Flame, 
  Sparkles, 
  Soup, 
  Wheat, 
  Cookie, 
  Coffee,
  Check
} from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  dietFilter: 'all' | FoodType;
  setDietFilter: (filter: 'all' | FoodType) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  dietFilter,
  setDietFilter,
}) => {
  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'biryani':
        return <Flame className="w-4 h-4 text-amber-600" />;
      case 'starters':
        return <Sparkles className="w-4 h-4 text-orange-600" />;
      case 'curries':
        return <Soup className="w-4 h-4 text-amber-700" />;
      case 'breads':
        return <Wheat className="w-4 h-4 text-amber-800" />;
      case 'desserts':
        return <Cookie className="w-4 h-4 text-yellow-600" />;
      case 'beverages':
        return <Coffee className="w-4 h-4 text-stone-700" />;
      default:
        return <UtensilsCrossed className="w-4 h-4 text-stone-600" />;
    }
  };

  return (
    <div className="py-4 border-b border-stone-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Horizontal Category Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                    : 'bg-[#181818] hover:bg-[#222] text-stone-300 border-amber-900/30'
                }`}
              >
                <span className={isActive ? 'text-white' : ''}>
                  {getCategoryIcon(cat.slug)}
                </span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Veg / Non-Veg Diet Filter Segmented Control */}
        <div className="flex items-center self-start sm:self-auto gap-1 p-1 bg-[#181818] rounded-lg border border-amber-900/30 shrink-0">
          <button
            onClick={() => setDietFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              dietFilter === 'all'
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setDietFilter('veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              dietFilter === 'veg'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-stone-400 hover:text-emerald-400'
            }`}
          >
            {/* Standard Indian Veg Dot in Square Symbol */}
            <span className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            </span>
            <span>Pure Veg</span>
          </button>

          <button
            onClick={() => setDietFilter('non-veg')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              dietFilter === 'non-veg'
                ? 'bg-white text-red-800 shadow-xs'
                : 'text-stone-400 hover:text-red-400'
            }`}
          >
            {/* Standard Indian Non-Veg Triangle in Square Symbol */}
            <span className="w-3.5 h-3.5 rounded-[3px] border border-red-700 flex items-center justify-center bg-white">
              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-700" />
            </span>
            <span>Non-Veg</span>
          </button>
        </div>

      </div>
    </div>
  );
};
