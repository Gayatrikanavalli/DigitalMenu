import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Search, QrCode, LogOut, Heart, Menu as MenuIcon, X, Home, UtensilsCrossed, Tag, Info, Phone } from 'lucide-react';
import { ActiveView, StaffUser } from '../types';
import { formatINR } from '../lib/storage';

interface HeaderProps {
  activeView: ActiveView;
  currentPath: string;
  isAuthenticated: boolean;
  user: StaffUser | null;
  isManager: boolean;
  isKitchenStaff: boolean;
  onNavigate: (view: string) => void;
  onLogin: (username: string, password: string) => void;
  onLogout: () => void;
  activeTable: string;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  wishlistCount?: number;
  onOpenWishlist?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  onOpenLocation?: () => void;
  onOpenCategoryDrawer?: () => void;
}

const STAFF_TITLES: Record<ActiveView, { title: string }> = {
  customer: { title: 'Menu' },
  menu: { title: 'Menu' },
  offers: { title: 'Offers' },
  about: { title: 'About' },
  contact: { title: 'Contact' },
  admin: { title: 'Admin Dashboard' },
  kitchen: { title: 'Kitchen Display' },
};

export const Header: React.FC<HeaderProps> = ({
  activeView,
  currentPath,
  isAuthenticated,
  user,
  isManager,
  isKitchenStaff,
  onNavigate,
  onLogin,
  onLogout,
  activeTable,
  cartCount,
  cartTotal,
  onOpenCart,
  wishlistCount = 0,
  onOpenWishlist,
  searchQuery,
  setSearchQuery,
  onOpenLocation,
  onOpenCategoryDrawer,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isCustomer = activeView === 'customer';
  const isStaff = activeView === 'admin' || activeView === 'kitchen';
  const staffTitle = STAFF_TITLES[activeView];
  const isMenuPage = currentPath === '/menu';

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className={`sticky top-0 z-40 border-b bg-white border-stone-200 shadow-sm`}>
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 h-14 ${isMenuPage ? 'max-w-none' : 'max-w-7xl'}`}>
        <div className="flex items-center justify-between h-full">

          {/* Zone 1: Brand */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-3 shrink-0 ${isMenuPage && isCustomer ? 'hidden lg:hidden' : ''}`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-amber-500/40">
              भ
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-bold tracking-tight font-serif text-stone-900">
                Bhojan<span className="text-amber-600 font-sans font-extrabold">QR</span>
              </span>
              {isCustomer ? (
                <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
                  BhojanQR Digital Menu
                </span>
              ) : (
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">
                  {staffTitle.title}
                </span>
              )}
            </div>
          </motion.div>

          {/* Zone 2: Navigation & Search */}
          <div className="hidden lg:flex items-center gap-4 flex-1 max-w-[380px] shrink-0">
            {!(isMenuPage && isCustomer) && (
              <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-stone-600">
                {isCustomer && (
                  <>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('customer')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/' || currentPath === '/customer' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Home
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('menu')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/menu' || currentPath.startsWith('/menu/') ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Menu
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('offers')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/offers' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Offers
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('/my-orders')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/my-orders' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      My Orders
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('about')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/about' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      About
                    </motion.button>
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      onClick={() => onNavigate('contact')}
                      className={`pb-0.5 font-medium whitespace-nowrap transition-colors ${currentPath === '/contact' ? 'text-amber-600 font-bold border-b-2 border-amber-600' : 'text-stone-600 hover:text-stone-900'}`}
                    >
                      Contact
                    </motion.button>
                  </>
                )}
              </nav>
            )}
            {!(isMenuPage && isCustomer) && (
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  placeholder="Search dishes..."
                  className="w-full bg-white text-stone-900 text-xs sm:text-sm pl-10 pr-8 py-2 sm:py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 placeholder:text-stone-400 transition-colors"
                />
              </div>
            )}
            {!(isMenuPage && isCustomer) && (
              <button
                type="button"
                onClick={() => onOpenLocation()}
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-amber-100 bg-white hover:bg-amber-50 text-amber-600 font-medium text-xs shadow-sm transition-all whitespace-nowrap"
                aria-label="Restaurant location"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Zone 3: Actions - SINGLE set for all screens */}
          <div className="flex items-center gap-2 shrink-0">
            {isCustomer && (
              <>
                {/* Hamburger - visible on ALL screens */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentPath === '/menu') {
                      onOpenCategoryDrawer?.();
                    } else {
                      setMobileMenuOpen(true);
                    }
                  }}
                  className="p-2.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100"
                  aria-label="Open navigation menu"
                >
                  <MenuIcon className="w-5 h-5" />
                </button>

                {/* Wishlist icon */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onOpenWishlist()}
                  className="p-2.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                </motion.button>

                {/* My Order button - SINGLE instance */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-sm shadow-sm transition-colors whitespace-nowrap"
                  onClick={() => onOpenCart()}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>My Order</span>
                  {cartCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white text-amber-700 font-bold text-xs tabular-nums">
                      {cartCount}
                    </span>
                  )}
                  {cartTotal > 0 && (
                    <span className="hidden lg:inline border-l border-amber-500/40 pl-2 font-semibold tabular-nums">
                      {formatINR(cartTotal)}
                    </span>
                  )}
                </motion.button>
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
      </div>

      {/* Navigation drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-stone-900/30"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-[220px] max-w-[85vw] bg-[#FFF1E0] shadow-xl flex flex-col overflow-x-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-amber-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold text-xl shadow-sm">भ</div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-base font-bold tracking-tight font-serif text-stone-900">
                      Bhojan<span className="text-amber-700 font-sans font-extrabold">QR</span>
                    </span>
                    <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider mt-0.5">Digital Menu</span>
                  </div>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="text-stone-500 hover:text-stone-800 p-1 rounded-md hover:bg-amber-100/70 transition-colors" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-1.5">
                {[
                  { label: 'Home', path: 'customer', match: currentPath === '/' || currentPath === '/customer', icon: Home },
                  { label: 'Menu', path: 'menu', match: currentPath === '/menu' || currentPath.startsWith('/menu/'), icon: UtensilsCrossed },
                  { label: 'Offers', path: 'offers', match: currentPath === '/offers', icon: Tag },
                  { label: 'My Orders', path: '/my-orders', match: currentPath === '/my-orders' || currentPath === '/orders', icon: ShoppingBag },
                  { label: 'About', path: 'about', match: currentPath === '/about', icon: Info },
                  { label: 'Contact', path: 'contact', match: currentPath === '/contact', icon: Phone },
                ].map((link) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={link.label}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (link.path === 'orders') {
                          onOpenCart();
                        } else {
                          onNavigate(link.path);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        link.match
                          ? 'bg-amber-500 text-white font-semibold shadow-md'
                          : 'text-stone-700 hover:bg-amber-100/70'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${link.match ? 'text-white' : 'text-stone-600'}`} strokeWidth={1.8} />
                      <span>{link.label}</span>
                    </button>
                  );
                })}
                {isCustomer && (
                  <div className="mt-4 pt-3 border-t border-amber-200/70 space-y-1">
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); onOpenWishlist?.(); }}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-amber-100/70 transition-colors"
                    >
                      Wishlist
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-stone-700 hover:bg-amber-100/70 transition-colors"
                    >
                      Table {activeTable}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
