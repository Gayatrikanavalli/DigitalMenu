import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Clock, CheckCircle2, XCircle, ChefHat, Receipt, X,
  RefreshCw, ChevronRight, Calendar, Hash, MapPin, CreditCard, ShoppingBag
} from 'lucide-react';
import { Order, OrderStatus, MenuItem } from '../types';
import { formatINR, getMyOrderNumbers, getActiveTable } from '../lib/storage';
import { api } from '../lib/api';

interface MyOrdersPageProps {
  menuItems: MenuItem[];
  onNavigate: (path: string) => void;
}

type FilterTab = 'all' | 'active' | 'completed' | 'cancelled';

const STATUS_CONFIG: Record<OrderStatus | 'served', { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'Order Placed', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Receipt className="w-4 h-4" /> },
  preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: 'Ready', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <Package className="w-4 h-4" /> },
  completed: { label: 'Completed', color: 'text-stone-700', bg: 'bg-stone-100', border: 'border-stone-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  served: { label: 'Completed', color: 'text-stone-700', bg: 'bg-stone-100', border: 'border-stone-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-4 h-4" /> },
};

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'preparing', label: 'Accepted / Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
];

function stepIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  if (status === 'served' || status === 'completed') return 3;
  if (status === 'ready') return 2;
  if (status === 'preparing') return 1;
  return 0;
}

function isActiveStatus(s: OrderStatus) {
  return s === 'pending' || s === 'preparing' || s === 'ready';
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

const ProgressTimeline: React.FC<{ status: OrderStatus }> = ({ status }) => {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
        <XCircle className="w-5 h-5" />
        <span className="font-semibold text-sm">Order Cancelled</span>
      </div>
    );
  }
  const current = stepIndex(status);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const done = idx <= current;
          const isCurrent = idx === current;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${done ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-stone-300 text-stone-400'} ${isCurrent ? 'ring-4 ring-amber-100' : ''}`}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`mt-1.5 text-[10px] sm:text-xs font-medium text-center leading-tight ${done ? 'text-stone-900' : 'text-stone-400'}`}>{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-1 flex-1 mx-1 rounded-full ${idx < current ? 'bg-amber-500' : 'bg-stone-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const OrderDetailModal: React.FC<{
  order: Order;
  menuItems: MenuItem[];
  onClose: () => void;
}> = ({ order, menuItems, onClose }) => {
  const menuById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    menuItems.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [menuItems]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        className="relative z-10 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200"
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-stone-200 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-serif">Order Details</h3>
            <p className="text-xs text-stone-500 font-mono">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-3">Order Progress</h4>
            <ProgressTimeline status={order.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-1"><Calendar className="w-3.5 h-3.5" /> Date & Time</div>
              <div className="text-xs font-semibold text-stone-900">{formatDateTime(order.createdAt)}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-1"><Hash className="w-3.5 h-3.5" /> Order ID</div>
              <div className="text-xs font-semibold text-stone-900 font-mono break-all">{order.orderNumber}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-1"><MapPin className="w-3.5 h-3.5" /> Table</div>
              <div className="text-xs font-semibold text-stone-900">{order.tableNumber || '—'}</div>
            </div>
            <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px] font-medium mb-1"><CreditCard className="w-3.5 h-3.5" /> Payment</div>
              <div className="text-xs font-semibold text-stone-900">{order.status === 'completed' || order.status === 'served' ? 'Completed' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}</div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-900 mb-3">Ordered Items</h4>
            <div className="space-y-3">
              {order.items.map((it) => {
                const menu = menuById.get(String(it.menuItemId));
                const img = menu?.image || '';
                return (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                      {img ? <img src={img} alt={it.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-900 truncate">{it.name}</p>
                      <p className="text-xs text-stone-500">Qty: {it.quantity} × {formatINR(it.price)}</p>
                      {it.specialNotes ? <p className="text-xs text-amber-700 mt-0.5">Note: {it.specialNotes}</p> : null}
                    </div>
                    <div className="text-sm font-bold text-stone-900 tabular-nums">{formatINR(it.price * it.quantity)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-stone-600"><span>Subtotal</span><span className="tabular-nums">{formatINR(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-stone-600"><span>Tax</span><span className="tabular-nums">{formatINR(order.tax)}</span></div>
            <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-amber-200"><span>Total Amount</span><span className="text-amber-700 tabular-nums">{formatINR(order.total)}</span></div>
          </div>

          {order.specialInstructions ? (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">Special Instructions</h4>
              <p className="text-sm text-stone-600">{order.specialInstructions}</p>
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};

export const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ menuItems, onNavigate }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<Order | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const numbers = getMyOrderNumbers();
      const table = getActiveTable();
      const data = await api.orders.myOrders(numbers, table);
      setOrders(data);
    } catch (e: any) {
      setError(e?.message || 'Unable to load orders.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    const t = setInterval(() => fetchOrders(true), 10000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  useEffect(() => {
    if (!selected) return;
    const fresh = orders.find((o) => o.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [orders, selected]);

  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => isActiveStatus(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.status === 'served').length;
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;

  const filtered = useMemo(() => {
    if (tab === 'active') return orders.filter((o) => isActiveStatus(o.status));
    if (tab === 'completed') return orders.filter((o) => o.status === 'completed' || o.status === 'served');
    if (tab === 'cancelled') return orders.filter((o) => o.status === 'cancelled');
    return orders;
  }, [orders, tab]);

  const menuById = useMemo(() => {
    const map = new Map<string, MenuItem>();
    menuItems.forEach((m) => map.set(String(m.id), m));
    return map;
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-[#FBFBF9]">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">My Orders</h1>
            <p className="text-sm text-stone-500 mt-1">Track your orders and view order history</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></div>
            <div><p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total Orders</p><p className="text-2xl font-bold text-stone-900 tabular-nums">{totalOrders}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
            <div><p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Active Orders</p><p className="text-2xl font-bold text-stone-900 tabular-nums">{activeOrders}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>
            <div><p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Completed Orders</p><p className="text-2xl font-bold text-stone-900 tabular-nums">{completedOrders}</p></div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1 bg-white rounded-xl border border-stone-200 mb-6 w-fit">
          {([
            { key: 'all', label: `All (${totalOrders})` },
            { key: 'active', label: `Active (${activeOrders})` },
            { key: 'completed', label: `Completed (${completedOrders})` },
            { key: 'cancelled', label: `Cancelled (${cancelledOrders})` },
          ] as { key: FilterTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${tab === t.key ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-stone-500">Loading your orders…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center"><Package className="w-8 h-8" /></div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">{totalOrders === 0 ? 'No orders yet' : 'No orders in this view'}</h3>
            <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
              {totalOrders === 0 ? "You haven't placed any orders yet. Browse our menu and place your first order!" : 'Try a different filter to see your orders.'}
            </p>
            {totalOrders === 0 && (
              <button onClick={() => onNavigate('/menu')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition-colors">
                Browse Menu <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const firstItem = order.items[0];
              const menu = firstItem ? menuById.get(String(firstItem.menuItemId)) : undefined;
              const previewImg = menu?.image || '';
              return (
                <motion.button
                  key={order.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(order)}
                  className="w-full text-left bg-white rounded-xl border border-stone-200 p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0 hidden sm:block">
                      {previewImg ? <img src={previewImg} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-stone-900 font-mono">{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-stone-500">{formatDateTime(order.createdAt)} · Table {order.tableNumber || '—'}</p>
                      <p className="text-sm text-stone-700 mt-1 truncate">
                        {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:flex-col sm:items-end">
                      <div className="text-right">
                        <p className="text-xs text-stone-500">Total</p>
                        <p className="text-lg font-bold text-amber-700 tabular-nums">{formatINR(order.total)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">View details <ChevronRight className="w-4 h-4" /></span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </main>

      <AnimatePresence>
        {selected && (
          <OrderDetailModal order={selected} menuItems={menuItems} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
