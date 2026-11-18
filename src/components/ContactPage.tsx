import React from 'react';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';

interface ContactPageProps {
  activeTable: string;
  onOpenTableModal: () => void;
  onOpenLocation: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  activeTable,
  onOpenTableModal,
  onOpenLocation,
}) => {
  return (
    <div className="min-h-screen bg-white text-stone-900 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 leading-tight">
              Contact Us
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              Visit us or place a catering order
            </p>
          </div>
          <button
            onClick={() => onOpenLocation()}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2"
          >
            Get Directions <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Restaurant Address</div>
                  <div className="text-stone-600 text-sm leading-relaxed">
                    42 Heritage Boulevard<br />
                    Indiranagar, Bengaluru, KA 560038
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Opening Hours</div>
                  <div className="text-stone-600 text-sm space-y-1">
                    <div>Lunch: 12:00 PM – 4:00 PM</div>
                    <div>Dinner: 7:00 PM – 11:30 PM</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Reservations</div>
                  <div className="text-stone-600 text-sm space-y-1">
                    <div>+91 98765 43210</div>
                    <div>+91 98765 43211</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-stone-900">Email</div>
                  <div className="text-stone-600 text-sm leading-relaxed">
                    hello@bhojanqr.example
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 space-y-4">
            <div className="p-6 rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-500/40">
              <div className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
                Current Table
              </div>
              <div className="text-2xl font-serif font-bold text-white">
                Table {activeTable}
              </div>
              <p className="text-amber-100/90 text-sm mt-2 leading-relaxed">
                Scan your table QR code to browse the menu and place your order directly from your seat.
              </p>
              <button
                onClick={() => onOpenTableModal()}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-amber-100 font-semibold text-sm hover:bg-stone-800 transition-colors"
              >
                Change Table
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
