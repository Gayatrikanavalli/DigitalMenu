import React, { useState } from 'react';
import { ShoppingBag, Search, UtensilsCrossed, QrCode, LogOut, Heart } from 'lucide-react';
import { ActiveView, StaffUser } from '../types';
import { formatINR } from '../lib/storage';

interface HeaderProps {
  activeView: ActiveView;
  isAuthenticated: boolean;
  user: StaffUser | null;
  isManager: boolean;
  isKitchenStaff: boolean;
  onNavigate: (view: ActiveView) => void;
  onScrollTo: (section: string) => void;
  onLogin: (username: string, password: string) => void;
  onLogout: () => void;
  activeTable: string;
  onOpenTableModal: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenLocation?: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: string;
  setSortBy: (s: string) => void;
}

const STAFF_TITLES: Record<ActiveView, { title: string; subtitle: string }> = {
  customer: { title: 'Digital Menu', subtitle: 'Browse our menu and place orders' },
  admin: { title: 'Admin Dashboard', subtitle: 'Manage menu, tables, orders & reports' },
  kitchen: { title: 'Kitchen Display', subtitle: 'View orders & update preparation status' },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  isAuthenticated,
  user,
  isManager,
  isKitchenStaff,
  onNavigate,
  onScrollTo,
  onLogin,
  onLogout,
  activeTable,
  onOpenTableModal,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenLocation,
  wishlistCount = 0,
  onOpenWishlist,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}) => {
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const isCustomer = activeView === 'customer';
  const isStaff = activeView === 'admin' || activeView === 'kitchen';
  const staffTitle = STAFF_TITLES[activeView];

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b ${activeView === 'customer' ? 'bg-[#0B0B0B]/95 border-amber-900/20' : 'bg-white/95 border-stone-200'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 lg:gap-8">
          
          {/* Zone 1: Brand + Page Title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-amber-500/40">
              भ
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`text-xl font-bold tracking-tight font-serif ${isCustomer ? 'text-white' : 'text-stone-900'} ${isStaff ? 'hidden sm:inline' : 'block'}`}>
                Bhojan<span className={`${isCustomer ? 'text-amber-400' : 'text-amber-600'} font-sans font-extrabold`}>QR</span>
              </span>
              {!isStaff && (
                <span className={`text-[11px] font-medium tracking-wide uppercase block ${isCustomer ? 'text-stone-400' : 'text-stone-700'}`}>
                  Fine Dining & QR Order
                </span>
              )}
              {activeView === 'admin' && (
                <div className="flex flex-col leading-tight">
                  <span className="text-[22px] font-semibold text-stone-900 sm:text-[24px]">
                    Admin Dashboard
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Zone 2: Navigation Links (Customer only) */}
          {isCustomer && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium shrink-0">
              <button
                onClick={() => onNavigate('customer')}
                className="whitespace-nowrap pb-0.5 text-amber-400 border-b-2 border-amber-400 font-semibold transition-colors"
              >
                Digital Menu
              </button>
              <button
                onClick={() => onScrollTo('about')}
                className="whitespace-nowrap pb-0.5 text-amber-400 font-medium transition-colors duration-200 hover:text-amber-300"
              >
                About Us
              </button>
              <button
                onClick={() => onScrollTo('contact')}
                className="whitespace-nowrap pb-0.5 text-amber-400 font-medium transition-colors duration-200 hover:text-amber-300"
              >
                Contact
              </button>
              {isCustomer && (
                <>
                  <span className="text-sm font-medium text-amber-400 mr-1 transition-colors duration-200 hover:text-amber-300">Sort By</span>
                  <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="ml-2 text-sm px-2 py-1 rounded-md border border-amber-500/30 bg-[#303030] text-amber-400 font-medium focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option className="bg-[#303030] text-white" value="relevance">Recommended</option>
                  <option className="bg-[#303030] text-white" value="price-low">Price: Low to High</option>
                  <option className="bg-[#303030] text-white" value="price-high">Price: High to Low</option>
                  <option className="bg-[#303030] text-white" value="name-asc">Name A-Z</option>
                  <option className="bg-[#303030] text-white" value="veg-first">Veg first</option>
                </select>
                </>
              )}
            </nav>
          )}

          {/* Center Search (Customer desktop only) */}
          {isCustomer && (
            <div className="hidden lg:flex items-center flex-1 max-w-xs relative">
              <Search className="w-4 h-4 absolute left-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-[#292929] hover:bg-[#292929] focus:bg-[#292929] text-white text-xs pl-9 pr-8 py-2 rounded-lg border border-[#B89436] focus:border-[#F5C542] focus:outline-none transition-colors placeholder:text-stone-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 text-stone-400 hover:text-stone-700">✕</button>
              )}
            </div>
          )}

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isCustomer && (
              <>
                <button
                  onClick={() => setShowSearchMobile(!showSearchMobile)}
                  className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100"
                  aria-label="Toggle search"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={onOpenLocation}
                  className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-amber-500/40 bg-[#181818] hover:bg-amber-500/10 transition-all whitespace-nowrap"
                  aria-label="Restaurant location"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"
                      fill="#F59E0B"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={onOpenWishlist}
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/40 bg-[#181818] hover:bg-amber-500/10 text-amber-400 font-medium text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
                  aria-label="Wishlist"
                >
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold text-xs tabular-nums">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">My Order</span>
                  {cartCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 font-bold text-xs tabular-nums">
                      {cartCount}
                    </span>
                  )}
                  {cartTotal > 0 && (
                    <span className="hidden md:inline border-l border-amber-500/60 pl-2 font-semibold tabular-nums">
                      {formatINR(cartTotal)}
                    </span>
                  )}
                </button>
              </>
            )}
            {isStaff && isAuthenticated && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Input expansion (Customer only) */}
        {showSearchMobile && isCustomer && (
          <div className="lg:hidden pb-3 pt-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-[#292929] text-white text-xs pl-9 pr-8 py-2 rounded-lg border border-[#B89436] focus:outline-none focus:border-[#F5C542] placeholder:text-stone-400"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-700">✕</button>
              )}
            </div>
          </div>
        )}

        {/* Mobile navigation tab strip */}
        <div className={`md:hidden flex items-center justify-between border-t py-2 text-xs font-medium overflow-x-auto no-scrollbar gap-4 ${isCustomer ? 'border-stone-800 text-stone-300' : 'border-stone-100 text-stone-600'}`}>
          <button
            onClick={() => onNavigate('customer')}
            className={`whitespace-nowrap pb-1 ${
              activeView === 'customer' ? 'text-amber-400 font-bold border-b-2 border-amber-400' : ''
            }`}
          >
            Digital Menu
          </button>
          {isCustomer && (
            <>
               <button
                onClick={() => onScrollTo('about')}
                className="whitespace-nowrap pb-1 text-amber-400 font-medium transition-colors duration-200 hover:text-amber-300"
              >
                About Us
              </button>
              <button
                onClick={() => onScrollTo('contact')}
                className="whitespace-nowrap pb-1 text-amber-400 font-medium transition-colors duration-200 hover:text-amber-300"
              >
                Contact
              </button>
            </>
          )}
          {isStaff && isAuthenticated && (
            <button
              onClick={onLogout}
              className="whitespace-nowrap pb-1 text-stone-500 font-medium"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
