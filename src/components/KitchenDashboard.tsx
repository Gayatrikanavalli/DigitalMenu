import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, AlertTriangle, CheckCircle, ArrowRight, Utensils, RefreshCw, Flame, Check, RotateCcw } from 'lucide-react';
import { Order, OrderStatus, StaffUser } from '../types';
import { formatINR } from '../lib/storage';

interface KitchenDashboardProps {
  isAuthenticated: boolean;
  orders: Order[];
  user: StaffUser | null;
  statusUpdating: Set<string>;
  onLogout: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
}

export const KitchenDashboard: React.FC<KitchenDashboardProps> = ({
  isAuthenticated,
  orders,
  user,
  statusUpdating,
  onLogout,
  onUpdateStatus,
}) => {
  if (!isAuthenticated) return null;

  const [filterStatus, setFilterStatus] = useState<'active' | 'all'>('active');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Auto-refresh timer every 10 seconds to simulate real-time polling
  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefreshed(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const activeOrders = orders.filter((o) =>
    filterStatus === 'active'
      ? o.status === 'pending' || o.status === 'preparing' || o.status === 'ready'
      : true
  );

  const getElapsedTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    return `${diffMins} mins ago`;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" />
            <span>New Order</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-blue-700" />
            <span>In Tandoor / Cooking</span>
          </span>
        );
      case 'ready':
        return (
          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            <span>Plated & Ready</span>
          </span>
        );
      case 'completed':
        return (
          <span className="bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-md text-xs font-medium">
            Served
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-md text-xs font-medium">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      
      {/* KDS Header */}
      <div className="bg-stone-900 border-b border-stone-800 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Bhojan Kitchen Display System (KDS)
              <span className="text-xs bg-stone-800 text-amber-400 font-mono px-2 py-0.5 rounded">
                Live Terminal
              </span>
            </h1>
            <p className="text-xs text-stone-400">
              Kitchen Station #1 · Real-time DRF Order Feed · Auto-polling active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          <div className="flex bg-stone-800 p-1 rounded-lg border border-stone-700 text-xs">
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded font-bold transition-colors ${
                filterStatus === 'active'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Active Tickets ({orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded font-bold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All History
            </button>
          </div>

          <button
            onClick={() => setLastRefreshed(new Date())}
            className="p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 text-xs flex items-center gap-1.5 border border-stone-700"
            title="Poll fresh orders"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <ChefHat className="w-16 h-16 mx-auto mb-3 opacity-30 text-amber-500" />
            <h2 className="text-lg font-bold text-stone-300">All Table Orders Clear!</h2>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              There are currently no active tickets waiting in the kitchen line. Incoming QR orders from customers will show up here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeOrders.map((order) => {
              const isPending = order.status === 'pending';
              const isPreparing = order.status === 'preparing';
              const isReady = order.status === 'ready';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition-all ${
                    isPending
                      ? 'bg-stone-900 border-amber-500/80 ring-2 ring-amber-500/30'
                      : isPreparing
                      ? 'bg-stone-900 border-blue-500/70'
                      : isReady
                      ? 'bg-stone-900 border-emerald-500/80'
                      : 'bg-stone-900/60 border-stone-800 opacity-60'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-stone-800 flex items-start justify-between bg-stone-900/90">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
                          Table {order.tableNumber}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          #{order.orderNumber}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        Diner: <strong className="text-stone-200">{order.customerName}</strong>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      <span className="text-[11px] text-stone-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {getElapsedTime(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Items List */}
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                    <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Dishes to Prepare ({order.items.reduce((acc, it) => acc + it.quantity, 0)})
                    </div>

                    <div className="space-y-2.5">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-2 p-2 rounded-lg bg-stone-800/80 border border-stone-700/50"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="w-7 h-7 rounded bg-amber-600/30 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 border border-amber-500/40 tabular-nums">
                              {item.quantity}x
                            </span>
                            <div>
                              <div className="text-sm font-bold text-white leading-tight">
                                {item.name}
                              </div>
                              <span className="text-[11px] text-stone-400 capitalize">
                                {item.foodType}
                              </span>
                              {item.specialNotes && (
                                <div className="text-xs text-amber-300 font-semibold mt-0.5">
                                  Note: {item.specialNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Special Instructions */}
                    {order.specialInstructions && (
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-600/50 text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-300">Customer Note:</strong>{' '}
                          {order.specialInstructions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ticket Footer Action Buttons */}
                  <div className="p-4 border-t border-stone-800 bg-stone-900/90 flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'preparing')}
                        disabled={statusUpdating.has(order.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {statusUpdating.has(order.id) ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin" />
                            <span>Starting...</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-4 h-4" />
                            <span>Start Cooking</span>
                          </>
                        )}
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'ready')}
                        disabled={statusUpdating.has(order.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {statusUpdating.has(order.id) ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Ready to Serve</span>
                          </>
                        )}
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => onUpdateStatus(order.id, 'completed')}
                        disabled={statusUpdating.has(order.id)}
                        className="w-full py-2.5 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 active:bg-stone-800 text-stone-200 font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {statusUpdating.has(order.id) ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Mark Delivered</span>
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <div className="w-full text-center py-2 text-xs text-stone-400 font-semibold">
                        Completed at {new Date(order.updatedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
