import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MessageCircle, X, ShoppingCart, Sparkles } from 'lucide-react';
import { MenuItem, Category } from '../types';
import { formatINR } from '../lib/storage';

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

const QUESTIONS = [
  "What are today's specials?",
  'What are the bestsellers?',
  'Show me vegetarian dishes.',
  'Recommend something under ₹200.',
  'Which dishes are less spicy?',
  'What categories are available?',
  'Recommend a dish for me.',
];

export const FoodAssistant: React.FC<FoodAssistantProps> = ({ menuItems, categories, onAddToCart }) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'welcome', role: 'assistant', text: 'Welcome to BhojanQR! What would you like to enjoy today?' },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const available = (items: MenuItem[]) => items.filter((d) => d.isAvailable && d.isActive !== false);

  const answerFor = (q: string): { text: string; dishes?: MenuItem[] } => {
    const low = q.toLowerCase();
    if (low.includes('special')) {
      const specials = available(menuItems.filter((d) => d.isSpecial));
      if (specials.length === 0) return { text: 'No special dishes are marked today. Here are some available dishes instead.', dishes: available(menuItems).slice(0, 6) };
      return { text: `Here are today's special dishes (${specials.length}):`, dishes: specials.slice(0, 6) };
    }
    if (low.includes('bestseller')) {
      const popular = available(menuItems.filter((d) => d.isPopular || (d.orderCount && d.orderCount > 0) || (d.popularity && d.popularity > 0)));
      const list = popular.length ? popular : available(menuItems);
      return { text: popular.length ? 'Our popular dishes:' : 'Here are some dishes you might enjoy:', dishes: list.slice(0, 6) };
    }
    if (low.includes('vegetarian')) {
      const veg = available(menuItems.filter((d) => d.foodType === 'veg'));
      if (veg.length === 0) return { text: 'No vegetarian dishes available right now.' };
      return { text: `We have ${veg.length} vegetarian dishes available:`, dishes: veg.slice(0, 6) };
    }
    if (low.includes('under') || low.includes('₹200') || low.includes('200')) {
      const under = available(menuItems.filter((d) => d.price < 200));
      if (under.length === 0) return { text: 'No dishes under ₹200 are available right now.' };
      return { text: `Dishes under ₹200 (${under.length}):`, dishes: under.slice(0, 6) };
    }
    if (low.includes('less spicy') || low.includes('spicy')) {
      const mild = available(menuItems.filter((d) => d.spiciness === 'mild'));
      if (mild.length === 0) return { text: 'No mild dishes are marked. Here are available dishes:', dishes: available(menuItems).slice(0, 6) };
      return { text: `Mild / less spicy dishes (${mild.length}):`, dishes: mild.slice(0, 6) };
    }
    if (low.includes('categor')) {
      if (categories.length === 0) return { text: 'Categories are not available right now.' };
      return { text: 'Available categories: ' + categories.map((c) => c.name).join(', ') + '.' };
    }
    if (low.includes('recommend')) {
      const pool = available(menuItems);
      if (pool.length === 0) return { text: 'No dishes available right now.' };
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return { text: 'I recommend trying this:', dishes: [pick] };
    }
    return { text: 'I can help with specials, bestsellers, vegetarian dishes, budget options, spice levels, categories and recommendations.' };
  };

  const ask = (q: string) => {
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => {
      const { text, dishes } = answerFor(q);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text, dishes }]);
      setLoading(false);
    }, 300);
  };

  const panelVariants = reduced
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, scale: 0.95, y: 24 }, visible: { opacity: 1, scale: 1, y: 0 } };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
            animate={reduced ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            transition={reduced ? {} : { y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }, default: { duration: 0.2 } }}
            onClick={() => setOpen(true)}
            aria-label="Open food assistant"
            className="fixed bottom-20 sm:bottom-5 right-4 sm:right-5 z-50 w-14 h-14 rounded-full bg-amber-500 text-stone-900 shadow-lg flex items-center justify-center"
            whileHover={reduced ? {} : { scale: 1.08 }}
            whileTap={reduced ? {} : { scale: 0.94 }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={panelVariants}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-4 right-4 sm:right-5 z-50 flex flex-col rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-[#121212] w-[calc(100vw-2rem)] sm:w-[440px] h-[88vh] sm:h-[640px] max-h-[90vh] sm:max-h-[680px]"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-stone-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-sm sm:text-base">BhojanQR Food Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-black/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation area */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-amber-500 text-stone-900 font-medium'
                        : 'bg-[#1e1e1e] text-stone-200 border border-amber-900/30'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.dishes && m.dishes.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {m.dishes.map((d) => (
                          <motion.div
                            key={d.id}
                            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28 }}
                            className="flex gap-3 bg-[#161616] rounded-xl p-3 border border-amber-900/20 items-start"
                          >
                            <img
                              src={d.image}
                              alt={d.name}
                              className="w-20 h-20 rounded-lg object-cover shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'; }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-stone-100 font-semibold text-sm line-clamp-1">{d.name}</p>
                              <p className="text-stone-400 text-xs line-clamp-3 mt-1 leading-relaxed">{d.description}</p>
                              <div className="flex items-center justify-between mt-2 gap-2">
                                <span className="text-amber-400 font-bold text-sm">{formatINR(d.price)}</span>
                                <button
                                  onClick={() => d.isAvailable && onAddToCart(d)}
                                  disabled={!d.isAvailable}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-400 text-stone-900 text-xs font-bold rounded shrink-0"
                                >
                                  {d.isAvailable ? 'Add to Cart' : 'Unavailable'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1e1e1e] text-stone-400 text-sm px-4 py-2 rounded-2xl border border-amber-900/30">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Suggested questions */}
            <div className="shrink-0 border-t border-amber-900/30 bg-[#0e0e0e] p-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {QUESTIONS.map((q) => (
                  <motion.button
                    key={q}
                    onClick={() => ask(q)}
                    whileHover={reduced ? {} : { scale: 1.03 }}
                    whileTap={reduced ? {} : { scale: 0.97 }}
                    className="shrink-0 px-3 py-2 text-xs rounded-lg bg-[#1e1e1e] text-amber-300 border border-amber-900/40 hover:bg-amber-500/10 text-left whitespace-nowrap"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};