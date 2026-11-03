import React from 'react';
import { CheckCircle2, Clock, Utensils, ChefHat, Bell, ArrowRight, X } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatINR } from '../lib/storage';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  onViewKitchen?: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewKitchen,
}) => {
  if (!order) return null;

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 0;
      case 'preparing':
        return 1;
      case 'ready':
        return 2;
      case 'completed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStatusStepIndex(order.status);

  const steps = [
    { title: 'Order Received', desc: 'Sent to Kitchen', icon: CheckCircle2 },
    { title: 'In Kitchen', desc: 'Chef preparing', icon: ChefHat },
    { title: 'Ready to Serve', desc: 'On its way to table', icon: Bell },
    { title: 'Delivered', desc: 'Bon Appétit', icon: Utensils },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Header */}
        <div className="text-center pb-5 border-b border-stone-100">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif">
            Order Sent to Bhojan Kitchen!
          </h2>
          <p className="text-xs text-stone-600 mt-1">
            Order <strong className="text-stone-900 font-mono">{order.orderNumber}</strong> for Table{' '}
            <strong className="text-amber-800 font-bold">{order.tableNumber}</strong>
          </p>
        </div>

        {/* Live Order Progress Tracker */}
        <div className="py-6 border-b border-stone-100">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4 text-center">
            Live Kitchen Status
          </div>

          <div className="grid grid-cols-4 gap-2 text-center relative">
            {/* Connecting line */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
            
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const Icon = st.icon;

              return (
                <div key={st.title} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isPast
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-amber-600 text-white ring-4 ring-amber-100'
                        : 'bg-stone-100 text-stone-400 border border-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-bold mt-2 ${
                      isCurrent
                        ? 'text-amber-900'
                        : isPast
                        ? 'text-emerald-700'
                        : 'text-stone-600'
                    }`}
                  >
                    {st.title}
                  </span>
                  <span className="text-[10px] text-stone-600 hidden sm:block">
                    {st.desc}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Estimated Prep Time:</span>
            </div>
            <strong className="tabular-nums font-bold">~{order.estimatedMinutes || 20} minutes</strong>
          </div>
        </div>

        {/* Order Details & Summary */}
        <div className="py-4 space-y-3">
          <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Order Summary
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {order.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-xs py-1 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-800 tabular-nums">
                    {it.quantity}x
                  </span>
                  <span className="text-stone-800 font-medium">{it.name}</span>
                </div>
                <span className="font-semibold text-stone-900 tabular-nums">
                  {formatINR(it.price * it.quantity)}
                </span>
              </div>
            ))}
          </div>

          {order.specialInstructions && (
            <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-600">
              <strong className="text-stone-800">Note:</strong> {order.specialInstructions}
            </div>
          )}

          <div className="pt-2 flex justify-between items-center text-sm font-bold text-stone-900">
            <span>Total Amount</span>
            <span className="text-amber-800 tabular-nums text-base">{formatINR(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row gap-2">
          {onViewKitchen && (
            <button
              onClick={onViewKitchen}
              className="flex-1 py-2.5 px-3 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ChefHat className="w-4 h-4 text-amber-600" />
              <span>Open Kitchen Display (Staff)</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors text-center"
          >
            Order More Food
          </button>
        </div>

      </div>
    </div>
  );
};
