import React, { useState, useRef } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, Utensils, QrCode } from 'lucide-react';
import { CartItem, Order } from '../types';
import { formatINR } from '../lib/storage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onClearCart: () => void;
  activeTable: string;
  onOpenTableModal: () => void;
  onPlaceOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    specialInstructions: string;
  }) => Promise<Order>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onClearCart,
  activeTable,
  onOpenTableModal,
  onPlaceOrder,
}) => {
  const customerNameRef = useRef<HTMLInputElement>(null);
  const customerPhoneRef = useRef<HTMLInputElement>(null);
  const specialInstructionsRef = useRef<HTMLTextAreaElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const hasUnavailableItems = cartItems.some(
    (ci) => !ci.menuItem.isAvailable || ci.menuItem.isActive === false
  );
  const tax = Number((subtotal * 0.05).toFixed(2)); // 5% GST
  const grandTotal = Number((subtotal + tax).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    const unavailableItems = cartItems.filter(
      (ci) => !ci.menuItem.isAvailable || ci.menuItem.isActive === false
    );
    if (unavailableItems.length > 0) {
      setErrorMsg(
        `Some items are no longer available: ${unavailableItems.map((ci) => ci.menuItem.name).join(', ')}. Please remove them before checkout.`
      );
      return;
    }

    const customerName = customerNameRef.current?.value || '';
    const customerPhone = customerPhoneRef.current?.value || '';
    const specialInstructions = specialInstructionsRef.current?.value || '';

    if (!customerName.trim()) {
      setErrorMsg('Please enter your name for the table order ticket.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onPlaceOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        specialInstructions: specialInstructions.trim(),
      });
      // Reset fields
      if (customerNameRef.current) customerNameRef.current.value = '';
      if (customerPhoneRef.current) customerPhoneRef.current.value = '';
      if (specialInstructionsRef.current) specialInstructionsRef.current.value = '';
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Your Table Order</h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-600">
                <span>Serving Table:</span>
                <button
                  type="button"
                  onClick={onOpenTableModal}
                  className="font-bold text-amber-700 underline flex items-center gap-1 hover:text-amber-800"
                >
                  <QrCode className="w-3 h-3" />
                  <span>{activeTable}</span>
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/50"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-stone-400">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <Utensils className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800">Your order is empty</h3>
                <p className="mt-1 text-xs text-stone-500 max-w-xs">
                  Scan through our aromatic Biryanis, Tandoori starters, and royal curries to add items to your table.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                >
                  Browse Dishes
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cartItems.map(({ menuItem, quantity }) => (
                    <div
                      key={menuItem.id}
                      className="p-3 rounded-xl border border-stone-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {menuItem.foodType === 'veg' ? (
                            <span className="w-3.5 h-3.5 rounded-[3px] border border-emerald-600 flex items-center justify-center bg-white shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            </span>
                          ) : (
                            <span className="w-3.5 h-3.5 rounded-[3px] border border-red-700 flex items-center justify-center bg-white shrink-0">
                              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-red-700" />
                            </span>
                          )}
                          <h4 className="text-sm font-semibold text-stone-900 truncate">
                            {menuItem.name}
                          </h4>
                        </div>
                        <div className="text-xs text-stone-500 mt-1 tabular-nums">
                          {formatINR(menuItem.price)} each
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 bg-stone-100 rounded-lg p-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
                          className="w-6 h-6 rounded bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-xs"
                          aria-label="Decrease quantity"
                        >
                          {quantity === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3" />}
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-stone-900 tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
                          className="w-6 h-6 rounded bg-amber-600 text-white hover:bg-amber-700 flex items-center justify-center font-bold text-xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right shrink-0 w-16">
                        <span className="text-sm font-bold text-stone-900 tabular-nums">
                          {formatINR(menuItem.price * quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Clear Cart Button */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all items</span>
                  </button>
                </div>

                {/* Customer Details & Order Form */}
                <form id="order-form" onSubmit={handleSubmit} className="pt-4 border-t border-stone-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      defaultValue=""
                      ref={customerNameRef}
                      style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a', backgroundColor: '#ffffff', caretColor: '#0f172a', opacity: 1 }}

                        placeholder="e.g. Rahul Verma"
                        className="customer-field w-full text-sm px-3 py-2 rounded-lg border border-[#d6d3d1] focus:outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/30 bg-[#ffffff] text-[#0f172a] placeholder:text-[#a8a29e]"


                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      defaultValue=""
                      ref={customerPhoneRef}
                      style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a', backgroundColor: '#ffffff', caretColor: '#0f172a', opacity: 1 }}

                        placeholder="+91 98765 43210"
                        className="customer-field w-full text-sm px-3 py-2 rounded-lg border border-[#d6d3d1] focus:outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/30 bg-[#ffffff] text-[#0f172a] placeholder:text-[#a8a29e]"


                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Special Cooking Instructions
                    </label>
                    <textarea
                      rows={2}
                      defaultValue=""
                      ref={specialInstructionsRef}
                      style={{ color: '#0f172a', WebkitTextFillColor: '#0f172a', backgroundColor: '#ffffff', caretColor: '#0f172a', opacity: 1 }}

                        className="customer-field w-full text-sm px-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/30 bg-white text-stone-900 placeholder:text-stone-400 resize-none"

                    />
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                      {errorMsg}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Footer: Price breakdown & Submit Order */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant GST (5%)</span>
                  <span className="font-semibold text-stone-900 tabular-nums">
                    {formatINR(tax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Table Service & Packaging</span>
                  <span className="text-emerald-700 font-semibold">FREE (₹0)</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex justify-between text-base font-bold text-stone-900">
                  <span>Total Payable</span>
                  <span className="text-amber-800 tabular-nums">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="order-form"
                disabled={isSubmitting || hasUnavailableItems}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-stone-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Sending to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm & Send to Kitchen</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-stone-500">
                Pay at table via UPI, Card, or Cash when food arrives.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
