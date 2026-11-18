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
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string }>({});

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const hasUnavailableItems = cartItems.some(
    (ci) => !ci.menuItem.isAvailable || ci.menuItem.isActive === false
  );
  const tax = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + tax).toFixed(2));

  const handlePhoneInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.currentTarget;
    const digits = target.value.replace(/\D/g, '').slice(0, 10);
    if (target.value !== digits) target.value = digits;
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleNameInput = () => {
    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
  };

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

    const customerName = (customerNameRef.current?.value || '').replace(/\s+/g, ' ').trim();
    const customerPhone = (customerPhoneRef.current?.value || '').replace(/\D/g, '').slice(0, 10);
    const specialInstructions = (specialInstructionsRef.current?.value || '').trim();

    if (customerNameRef.current) customerNameRef.current.value = customerName;
    if (customerPhoneRef.current) customerPhoneRef.current.value = customerPhone;

    const nextFieldErrors: { name?: string; phone?: string } = {};
    if (!customerName) {
      nextFieldErrors.name = 'Please enter your name for the order.';
    } else if (customerName.length < 2) {
      nextFieldErrors.name = 'Please enter a valid customer name.';
    }

    if (!customerPhone) {
      nextFieldErrors.phone = 'Please enter your 10-digit Indian mobile number.';
    } else if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      // Accept exactly 10 digits (Indian mobile numbers typically start 6-9)
      nextFieldErrors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.name || nextFieldErrors.phone) {
      setErrorMsg(nextFieldErrors.name || nextFieldErrors.phone || 'Please correct the highlighted fields.');
      if (nextFieldErrors.name) customerNameRef.current?.focus();
      else customerPhoneRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      setFieldErrors({});
      await onPlaceOrder({
        customerName,
        customerPhone,
        specialInstructions,
      });
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

  const inputBase =
    'block w-full min-w-0 max-w-full box-border rounded-lg border px-3 py-2.5 text-sm sm:text-base leading-6 ' +
    'bg-white text-stone-900 placeholder:text-stone-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-amber-500/30 ' +
    'disabled:opacity-60 disabled:cursor-not-allowed appearance-none';
  const inputOk = 'border-stone-300 focus:border-amber-600';
  const inputErr = 'border-red-400 focus:border-red-500 focus:ring-red-200';
  const inputStyle: React.CSSProperties = {
    color: '#1c1917',
    WebkitTextFillColor: '#1c1917',
    backgroundColor: '#ffffff',
    caretColor: '#1c1917',
    opacity: 1,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
        <div className="flex w-screen max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 p-4 sm:p-5">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">Your Table Order</h2>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-stone-500">
                <span>Serving Table:</span>
                <button
                  type="button"
                  onClick={onOpenTableModal}
                  className="flex items-center gap-1 font-bold text-amber-700 underline hover:text-amber-800"
                >
                  <QrCode className="h-3 w-3" />
                  <span>{activeTable}</span>
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-stone-400 hover:bg-stone-100/50 hover:text-stone-700"
              aria-label="Close cart"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-12 text-center text-stone-500">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <Utensils className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-stone-800">Your order is empty</h3>
                <p className="mt-1 max-w-xs text-xs text-stone-500">
                  Browse our menu and add items to your table order.
                </p>
                <button
                  onClick={onClose}
                  className="mt-5 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700"
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200/80 bg-white p-3 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {menuItem.foodType === 'veg' ? (
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-emerald-600 bg-white">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            </span>
                          ) : (
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-red-700 bg-white">
                              <span className="h-0 w-0 border-b-[5px] border-l-[3px] border-r-[3px] border-b-red-700 border-l-transparent border-r-transparent" />
                            </span>
                          )}
                          <h4 className="truncate text-sm font-semibold text-stone-900">
                            {menuItem.name}
                          </h4>
                        </div>
                        <div className="mt-1 text-xs tabular-nums text-stone-500">
                          {formatINR(menuItem.price)} each
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex shrink-0 items-center gap-2 rounded-lg bg-stone-50 p-1">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded border border-stone-200 bg-white text-xs font-bold text-stone-700 hover:bg-stone-100"
                          aria-label="Decrease quantity"
                        >
                          {quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                        </button>
                        <span className="w-5 text-center text-xs font-bold tabular-nums text-stone-900">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(menuItem.id, quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded bg-amber-600 text-xs font-bold text-white hover:bg-amber-500"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="w-16 shrink-0 text-right">
                        <span className="text-sm font-bold tabular-nums text-stone-900">
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
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear all items</span>
                  </button>
                </div>

                {/* Customer Details & Order Form */}
                <form id="order-form" onSubmit={handleSubmit} noValidate className="space-y-3 border-t border-stone-200 pt-4">
                  <div>
                    <label htmlFor="customer-name" className="mb-1 block text-xs font-semibold text-stone-700 sm:text-sm">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-name"
                      name="customerName"
                      type="text"
                      autoComplete="name"
                      autoCapitalize="words"
                      spellCheck={false}
                      defaultValue=""
                      ref={customerNameRef}
                      onInput={handleNameInput}
                      aria-invalid={!!fieldErrors.name}
                      aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
                      placeholder="e.g. Rahul Verma"
                      className={`${inputBase} ${fieldErrors.name ? inputErr : inputOk}`}
                      style={inputStyle}
                    />
                    {fieldErrors.name ? (
                      <p id="customer-name-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-stone-500">Enter the name for this table order (spaces allowed).</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customer-phone" className="mb-1 block text-xs font-semibold text-stone-700 sm:text-sm">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer-phone"
                      name="customerPhone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      pattern="[0-9]{10}"
                      maxLength={10}
                      defaultValue=""
                      ref={customerPhoneRef}
                      onInput={handlePhoneInput}
                      aria-invalid={!!fieldErrors.phone}
                      aria-describedby={fieldErrors.phone ? 'customer-phone-error' : undefined}
                      placeholder="10-digit mobile number"
                      className={`${inputBase} ${fieldErrors.phone ? inputErr : inputOk}`}
                      style={inputStyle}
                    />
                    {fieldErrors.phone ? (
                      <p id="customer-phone-error" className="mt-1 text-xs font-medium text-red-600">{fieldErrors.phone}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-stone-500">Enter exactly 10 digits (Indian mobile number, digits only).</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="customer-notes" className="mb-1 block text-xs font-semibold text-stone-700 sm:text-sm">
                      Special Cooking Instructions
                    </label>
                    <textarea
                      id="customer-notes"
                      name="specialInstructions"
                      rows={2}
                      defaultValue=""
                      ref={specialInstructionsRef}
                      placeholder="Any preferences for the kitchen (optional)"
                      className={`${inputBase} ${inputOk} resize-none`}
                      style={inputStyle}
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700">
                      {errorMsg}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Footer: Price breakdown & Submit Order */}
          {cartItems.length > 0 && (
            <div className="space-y-3 border-t border-stone-200 bg-stone-50 p-4 sm:p-6">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Restaurant GST (5%)</span>
                  <span className="font-semibold tabular-nums text-stone-900">
                    {formatINR(tax)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Table Service & Packaging</span>
                  <span className="font-semibold text-emerald-700">FREE (₹0)</span>
                </div>
                <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-900">
                  <span>Total Payable</span>
                  <span className="tabular-nums text-amber-800">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="order-form"
                disabled={isSubmitting || hasUnavailableItems}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:bg-amber-800 disabled:bg-stone-200 disabled:text-stone-400"
              >
                {isSubmitting ? (
                  <span>Sending to Kitchen...</span>
                ) : (
                  <>
                    <span>Confirm &amp; Send to Kitchen</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-stone-500">
                Pay at table via UPI, Card, or Cash when food arrives.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
