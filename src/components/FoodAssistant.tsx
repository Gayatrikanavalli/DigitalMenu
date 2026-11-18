import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { formatINR, getMyOrderNumbers, getActiveTable } from '../lib/storage';
import { api } from '../lib/api';

interface FoodAssistantProps {
  menuItems: MenuItem[];
  categories: Category[];
  onAddToCart: (item: MenuItem) => void;
}

interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  dishes?: MenuItem[];
}

const SUGGESTED_QUESTIONS = [
  "What are today's special dishes?",
  'What are the popular dishes?',
  'Do you have vegetarian options?',
  'What are the available offers?',
  'What is the price of a particular dish?',
];

const isDateActive = (item: MenuItem) => {
  const today = new Date();
  const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (item.offerStartDate && ymd < item.offerStartDate) return false;
  if (item.offerEndDate && ymd > item.offerEndDate) return false;
  return true;
};

const isConfiguredOffer = (item: MenuItem) => {
  if (item.isDeleted || item.isActive === false || item.isAvailable === false) return false;
  const discount = Number(item.discountPercentage || 0);
  if (discount <= 0) return false;
  if (item.offerActive === false) return false;
  if (item.isOfferActive === true) return true;
  if (item.isOfferActive === false) return false;
  return item.offerActive === true ? isDateActive(item) : discount > 0;
};

export const FoodAssistant: React.FC<FoodAssistantProps> = ({ menuItems, categories, onAddToCart }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'welcome', role: 'assistant', text: 'Hi! How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, loading]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const available = useMemo(() => menuItems.filter((d) => d.isAvailable && d.isActive !== false && !d.isDeleted), [menuItems]);

  const findDishMatches = (q: string) => {
    const low = q.toLowerCase();
    const tokens = low.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
    return available.filter((d) => {
      const name = d.name.toLowerCase();
      if (name.includes(low.trim())) return true;
      return tokens.some((t) => name.includes(t));
    });
  };

  const answerFor = async (q: string): Promise<{ text: string; dishes?: MenuItem[] }> => {
    const low = q.toLowerCase().trim();

    if (low.includes("today's special") || (low.includes('special') && low.includes('dish'))) {
      const specials = available.filter((d) => d.isSpecial || (d.tags || []).some((t) => t.toLowerCase().includes('special')));
      if (specials.length === 0) return { text: "No special dishes are marked right now. Here are some available dishes you might like:", dishes: available.slice(0, 6) };
      return { text: `Today's special dishes (${specials.length}):`, dishes: specials.slice(0, 8) };
    }

    if (low.includes('popular')) {
      const popular = available.filter((d) => d.isPopular || (d.orderCount || 0) > 0 || (d.popularity || 0) > 0);
      const list = popular.length ? popular : [...available].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
      if (!list.length) return { text: 'No dishes are available right now.' };
      return { text: popular.length ? `Popular dishes (${Math.min(popular.length, 8)} shown):` : 'Here are some dishes customers enjoy:', dishes: list.slice(0, 8) };
    }

    if (low.includes('vegetarian') || (low.includes('veg') && !low.includes('non'))) {
      const veg = available.filter((d) => d.foodType === 'veg');
      if (veg.length === 0) return { text: 'No vegetarian dishes are available right now.' };
      return { text: `We have ${veg.length} vegetarian options available. Here are some:`, dishes: veg.slice(0, 8) };
    }

    if (low.includes('available offers') || (low.includes('offer') && (low.includes('what') || low.includes('available') || low.includes('show') || low.includes('any')))) {
      const offers = menuItems.filter(isConfiguredOffer);
      if (offers.length === 0) return { text: 'There are no active offers at the moment.' };
      const lines = offers.slice(0, 8).map((o) => `${o.name}: ${Number(o.discountPercentage || 0)}% OFF - ${formatINR(o.price)} now ${formatINR(Math.round(o.price * (100 - Number(o.discountPercentage || 0)) / 100))}`);
      return { text: `Available offers (${offers.length}):\n${lines.join('\n')}${offers.length > 8 ? '\n...and more on the Offers page.' : ''}`, dishes: offers.slice(0, 6) };
    }

    if (low === 'what is the price of a particular dish?' || (low.includes('price') && low.includes('particular'))) {
      return { text: "Please type the dish name and I'll tell you its price from our current menu." };
    }

    if (low.includes('how can i place an order') || (low.includes('place') && low.includes('order'))) {
      return { text: 'To place an order:\n1. Open Menu and browse dishes.\n2. Tap "Add" (or adjust quantity) for items you want.\n3. Open "My Order" (cart) and review your items.\n4. Confirm your table, enter your details, and submit the order.\nYou can scan your table\'s QR code to start ordering for that table.' };
    }

    if (low.includes('how can i track my order') || (low.includes('track') && low.includes('order'))) {
      try {
        const numbers = getMyOrderNumbers();
        const table = getActiveTable();
        const orders = await api.orders.myOrders(numbers, table);
        if (!orders.length) {
          return { text: 'You can track your order on the My Orders page (/my-orders). No orders found for this session yet - once you place an order, its status will appear there with live updates.' };
        }
        const recent = orders.slice(0, 3).map((o) => `${o.orderNumber}: ${o.status} (Table ${o.tableNumber || '-'}, ${formatINR(o.total)})`).join('\n');
        return { text: `You can view live status updates on the My Orders page. Your recent orders:\n${recent}` };
      } catch {
        return { text: 'You can track your order on the My Orders page (/my-orders), where status updates from the kitchen appear automatically.' };
      }
    }

    if (low.includes('category') || low.includes('categories')) {
      if (!categories.length) return { text: 'Categories are not available right now.' };
      return { text: `Available categories: ${categories.map((c) => c.name).join(', ')}.` };
    }

    if (low.includes('price') || low.includes('cost') || low.includes('how much')) {
      const matches = findDishMatches(q);
      if (matches.length === 1) {
        const d = matches[0];
        const offer = isConfiguredOffer(d);
        const final = offer ? Math.round(d.price * (100 - Number(d.discountPercentage || 0)) / 100) : d.price;
        return { text: offer ? `${d.name}: ${formatINR(d.price)} (now ${formatINR(final)} with ${Number(d.discountPercentage || 0)}% OFF).` : `${d.name}: ${formatINR(d.price)}.`, dishes: [d] };
      }
      if (matches.length > 1) {
        return { text: `I found ${matches.length} matching dishes:`, dishes: matches.slice(0, 6) };
      }
      return { text: "I couldn't find that dish. Please type the exact dish name (as on the menu) to check its price." };
    }

    const matches = findDishMatches(q);
    if (matches.length > 0) {
      return { text: `Here's what I found for "${q}":`, dishes: matches.slice(0, 6) };
    }

    return { text: "I can help with today's specials, popular dishes, vegetarian options, available offers, dish prices, placing an order, and tracking your order. Please choose a suggestion or ask a question." };
  };

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { text: answer, dishes } = await answerFor(text);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role: 'assistant', text: answer, dishes }]);
    } catch {
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: 'Sorry, I could not fetch that right now. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          onClick={() => setOpen(true)}
          aria-label="Open chat assistant"
          className="fixed bottom-5 right-4 sm:right-5 z-50 w-14 h-14 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-popup"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-4 right-3 sm:bottom-5 sm:right-5 z-50 flex flex-col rounded-2xl overflow-hidden border border-amber-200 shadow-2xl bg-white w-[calc(100vw-1.5rem)] sm:w-[420px] h-[620px] max-h-[82vh]"
          >
            <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-[#FFF1E0] border-b border-amber-200/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm text-stone-900">BhojanQR Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="p-1.5 rounded-lg bg-[#FFF3E6] text-stone-800 border border-orange-200/70 hover:bg-[#FFDCC2] hover:border-orange-300/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FBFBF9]">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-[#FFF3E6] text-stone-800 border border-orange-200/70 font-medium rounded-br-md'
                        : 'bg-white text-stone-800 border border-stone-200 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.dishes && m.dishes.length > 0 && (
                      <div className="mt-2.5 space-y-2">
                        {m.dishes.map((d) => (
                          <div key={d.id} className="flex gap-2.5 bg-stone-50 rounded-xl p-2 border border-stone-200 items-start">
                            <img
                              src={d.image}
                              alt={d.name}
                              className="w-14 h-14 rounded-lg object-cover shrink-0 bg-stone-100"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-stone-900 font-semibold text-xs sm:text-sm line-clamp-1">{d.name}</p>
                              <p className="text-amber-700 font-bold text-xs mt-0.5">{formatINR(isConfiguredOffer(d) ? Math.round(d.price * (100 - Number(d.discountPercentage || 0)) / 100) : d.price)}{isConfiguredOffer(d) ? <span className="ml-1 text-[10px] font-semibold text-red-600">({Number(d.discountPercentage || 0)}% OFF)</span> : null}</p>
                              <button
                                type="button"
                                onClick={() => d.isAvailable && onAddToCart(d)}
                                disabled={!d.isAvailable}
                                className="mt-1.5 px-2.5 py-1 bg-[#FFF3E6] hover:bg-[#FFDCC2] disabled:bg-stone-200 disabled:text-stone-400 text-stone-800 border border-orange-200/70 text-[11px] font-bold rounded-md transition-colors"
                              >
                                {d.isAvailable ? 'Add to Cart' : 'Unavailable'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-stone-500 text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-md border border-stone-200 shadow-sm">Thinking...</div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white px-3 py-2.5">
              <p className="text-[11px] font-semibold text-stone-500 mb-2 px-0.5">Suggested questions</p>
              <div className="flex flex-row flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden pb-1">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    disabled={loading}
                    className="shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs sm:text-sm rounded-full bg-[#FFF3E6] text-stone-800 border border-orange-200/70 hover:bg-[#FFDCC2] hover:border-orange-300/70 transition-colors disabled:opacity-60"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" style={{ filter: 'drop-shadow(0 0 2px rgba(251,146,60,0.45))' }} aria-hidden="true" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="shrink-0 border-t border-stone-200 bg-white p-2.5">
              <form
                onSubmit={(e) => { e.preventDefault(); ask(input); }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 min-w-0 bg-stone-50 text-stone-900 text-sm px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 placeholder:text-stone-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="shrink-0 w-10 h-10 rounded-lg bg-[#FFF3E6] hover:bg-[#FFDCC2] disabled:bg-stone-200 disabled:text-stone-400 text-stone-800 border border-orange-200/70 flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};