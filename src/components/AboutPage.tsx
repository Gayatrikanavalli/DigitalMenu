import React from 'react';
import { QrCode, ArrowRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight">
              About BhojanQR
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Authentic Indian dining experience
            </p>
          </div>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors whitespace-nowrap"
          >
            Back to Home
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Left: Restaurant imagery */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-lg mb-8 lg:mb-0">
            <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <span className="text-amber-300 font-bold text-sm uppercase tracking-wider">Authentic Indian Cuisine</span>
              <h3 className="text-xl font-bold font-serif mt-1">Royal Heritage Dining</h3>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-stone-900 mb-4">
                About Our Restaurant
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                BhojanQR celebrates the royal heritage of slow dum cooking — where aged Basmati rice,
                freshly ground whole spices, and succulent meats are sealed in a handi and simmered over
                low charcoal embers for hours. Every dish carries the legacy of royal Mughlai kitchens and
                coastal Indian traditions, brought to your table with care.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-stone-900 mb-4">
                Our Food Philosophy
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                    🌶️
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">Traditional Recipes</span>
                    <p className="text-sm text-stone-500 mt-0.5">Handed down through generations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    🌿
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">Fresh Ingredients</span>
                    <p className="text-sm text-stone-500 mt-0.5">Locally sourced and prepared daily</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-800 font-bold">
                    🍛
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">Authentic Flavors</span>
                    <p className="text-sm text-stone-500 mt-0.5">Slow-dum cooking for rich taste</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-stone-900 mb-4">
                Quality & Experience
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    🥘
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">Dedicated Veg Kitchen</span>
                    <p className="text-sm text-stone-500 mt-0.5">Separate kitchen for vegetarian dishes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                    🐑
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">100% Halal Meats</span>
                    <p className="text-sm text-stone-500 mt-0.5">All meat is halal certified</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                    🧈
                  </div>
                  <div>
                    <span className="font-medium text-stone-900">Pure Ghee Cooking</span>
                    <p className="text-sm text-stone-500 mt-0.5">Authentic flavor with pure ghee</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-12 border-t border-stone-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold font-serif text-stone-900 mb-4">
              Scan & Order from Your Table
            </h2>
            <p className="text-stone-600 text-sm sm:text-base mb-6 leading-relaxed">
              Use your table QR code to browse our menu, add items to your cart, and place your order
              directly from your seat. No registration required — just scan, order, and enjoy.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="w-24 h-24 rounded-lg bg-white border border-stone-200 p-3 flex items-center justify-center shadow-sm">
                <QrCode className="w-16 h-16 text-stone-900" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-stone-900">Scan QR Code</span>
                <p className="text-xs text-stone-500">Open camera & scan table code</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
