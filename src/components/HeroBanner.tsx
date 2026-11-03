import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, Sparkles, Clock, QrCode } from 'lucide-react';
import { HERO_IMAGE } from '../lib/initialData';

interface HeroBannerProps {
  activeTable: string;
  onExploreMenu: () => void;
  onOpenTableModal: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const headingWordVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export const HeroBanner: React.FC<HeroBannerProps> = ({
  activeTable,
  onExploreMenu,
  onOpenTableModal,
}) => {
  const reduced = useReducedMotion();
  const heading = 'Savor the Grand Heritage of Dum Cooking'.split(' ');

  const cVariants = reduced ? { hidden: { opacity: 1 }, visible: { opacity: 1 } } : containerVariants;
  const iVariants = reduced ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } : itemVariants;
  const hVariants = reduced ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } } : headingWordVariants;

  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-stone-900 text-white my-4 sm:my-6 border border-[#D4AF37]/70 shadow-[0_0_20px_rgba(212,175,55,0.22)]"
      initial="hidden"
      animate="visible"
      variants={cVariants}
    >
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Royal Indian Dining Feast Spread"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
      </div>

      {/* Animated golden border light traveling along the rounded rectangle */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none z-20"
          style={{
            padding: '1.5px',
            background:
              'conic-gradient(from 0deg, transparent 0deg, rgba(212,175,55,0.15) 20deg, rgba(255,223,128,1) 55deg, rgba(212,175,55,0.95) 90deg, rgba(212,175,55,0.15) 130deg, transparent 180deg, transparent 360deg)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {reduced && (
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none z-20 border border-amber-500/40"
        />
      )}

      {/* Content Container */}
      <motion.div className="relative z-10 px-6 sm:px-10 lg:px-12 py-10 sm:py-14 max-w-3xl" variants={iVariants}>
        {/* Subtle trust marker without pill enclosures */}
        <motion.div variants={iVariants} className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider uppercase mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Authentic Royal Mughlai & Coastal Recipes</span>
          <span className="text-stone-500">·</span>
          <span>Slow Cooked On Charcoal Embers</span>
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight font-serif text-balance"
          style={{ textShadow: '0 0 24px rgba(245,158,11,0.22)' }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {heading.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.25em]"
              variants={hVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p variants={iVariants} className="mt-3 sm:mt-4 text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
          Order seamlessly straight from your table. Each dish is hand-crafted with freshly ground spices, aged Basmati rice, and slow-simmered rich curries.
        </motion.p>

        {/* Highlights Row */}
        <motion.div variants={iVariants} className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-stone-300">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Average preparation: 15–20 mins</span>
          </div>
          <span className="hidden sm:inline text-stone-600">·</span>
          <div className="flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Serving at Table: <strong className="text-white font-semibold">{activeTable}</strong></span>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={iVariants} className="mt-8 flex flex-wrap items-center gap-3">
          <motion.button
            whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
            whileTap={reduced ? {} : { scale: 0.97 }}
            onClick={onExploreMenu}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <span>Explore Menu & Order</span>
            <ArrowDown className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
            whileTap={reduced ? {} : { scale: 0.97 }}
            onClick={onOpenTableModal}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-stone-200 border border-white/20 text-xs sm:text-sm font-medium backdrop-blur-sm transition-all whitespace-nowrap"
          >
            <QrCode className="w-4 h-4 text-amber-400" />
            <span>Switch / Scan Table QR</span>
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};