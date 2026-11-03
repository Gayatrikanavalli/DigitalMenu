import React from 'react';
import { Utensils, MapPin, Clock, Phone, Mail, ShieldCheck, Heart } from 'lucide-react';
import { ActiveView } from '../types';

interface FooterProps {
  activeView: ActiveView;
  isAuthenticated: boolean;
  onNavigate: (view: ActiveView) => void;
  onScrollTo: (section: string) => void;
  onOpenTableModal: () => void;
  demoMode?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  activeView,
  isAuthenticated,
  onNavigate,
  onScrollTo,
  onOpenTableModal,
  demoMode = false,
}) => {
  const isCustomer = activeView === 'customer';

  return (
    <footer className="bg-stone-950 text-stone-200 border-t border-stone-800 mt-16 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xl font-serif shadow-lg shadow-amber-500/30">
                भ
              </div>
              <div>
                <span className="text-2xl font-bold font-serif text-white tracking-tight">
                  Bhojan<span className="text-amber-400 font-sans font-extrabold">QR</span>
                </span>
                <p className="text-[11px] text-amber-500 font-medium tracking-wider uppercase leading-none mt-0.5">
                  Authentic Indian Dining
                </p>
              </div>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">
              Celebrating the royal heritage of slow dum cooking, charcoal tandoor roasts,
              and time-honored Mughlai recipes — served straight to your table.
            </p>
            <div className="flex items-center gap-1.5 pt-2 text-[10px] text-amber-500 font-medium border-t border-stone-800">
              <ShieldCheck className="w-3 h-3" />
              <span>Pure Ghee · Halal Certified Meats · Dedicated Veg Kitchen</span>
            </div>
          </div>

          {/* Col 2: Timings & Address */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Hours & Location
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="text-stone-300 font-medium">Lunch</div>
                  <div>12:00 PM – 4:00 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="text-stone-300 font-medium">Dinner</div>
                  <div>7:00 PM – 11:30 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 mt-1">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight max-w-xs">
                  42 Heritage Boulevard, Indiranagar, Bengaluru, KA 560038
                </div>
              </div>
            </div>
          </div>

          {/* Col 3: Customer Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Customer Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-stone-400">
              {[
                { label: 'Home', section: 'home' },
                { label: 'Digital Menu', section: 'menu' },
                { label: 'About Us', section: 'about' },
                { label: 'Contact', section: 'contact' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={() => {
                      onScrollTo(item.section);
                    }}
                    className="w-full text-left hover:text-amber-400 hover:bg-stone-900/50 px-3 py-1.5 rounded-lg transition-colors text-stone-300"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
              {demoMode && (
                <li>
                  <button
                    onClick={() => onOpenTableModal()}
                    className="w-full text-left hover:text-amber-400 hover:bg-stone-900/50 px-3 py-1.5 rounded-lg transition-colors text-stone-300"
                  >
                    Table QR Code Scanner
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Contact Us
            </h4>
            <div className="space-y-3 text-sm text-stone-400">
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="text-stone-300 font-medium">Reservations</div>
                  <div>+91 98765 43210</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="text-stone-300 font-medium">Email</div>
                  <div>hello@bhojanqr.example</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Utensils className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <div className="text-stone-300 font-medium">Catering & Events</div>
                  <div>+91 98765 43211</div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-stone-800 text-stone-400 flex items-center justify-center hover:bg-amber-600 hover:text-white transition-colors"
              >
                <Heart className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div>
            © {new Date().getFullYear()} BhojanQR. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Authentic Indian Dining · Bengaluru</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
