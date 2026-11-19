import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  ChefHat,
  Eye,
  EyeOff,
  Lock,
  User,
  UtensilsCrossed,
} from 'lucide-react';

export type LoginIntended = 'admin' | 'kitchen';

interface LoginFormProps {
  intended: LoginIntended;
  onLogin: (username: string, password: string) => void | Promise<void>;
  onReturnToCustomer: () => void;
  error?: string;
  demoMode?: boolean;
}

const VIEW_LABELS: Record<LoginIntended, { title: string; subtitle: string; icon: React.ElementType }> = {
  admin: {
    title: 'Restaurant Admin Portal',
    subtitle: 'Restricted access for restaurant managers and administrators.',
    icon: UtensilsCrossed,
  },
  kitchen: {
    title: 'Kitchen Display System',
    subtitle: 'Restricted access for kitchen staff to view and update orders.',
    icon: ChefHat,
  },
};

export const LoginForm: React.FC<LoginFormProps> = ({
  intended,
  onLogin,
  onReturnToCustomer,
  error,
  demoMode = false,
}) => {
  const { title, subtitle, icon: Icon } = VIEW_LABELS[intended];
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setIsSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#1a120d] p-4 sm:p-6 lg:p-8">
      {/* Separate blurred background layer (real local food photograph) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[-20px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/restaurant-food-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(12px)',
          transform: 'scale(1.08)',
        }}
      />
      {/* Subtle dark overlay for readability (solid, no gradient background) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/45" />

      <div className="relative z-10 w-full max-w-[460px] sm:max-w-[520px]">
        <div
          className="w-full rounded-3xl border border-white/20 p-6 shadow-2xl shadow-black/50 sm:p-8 md:p-10"
          style={{
            backgroundColor: 'rgba(42, 27, 18, 0.62)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
          }}
        >
          {/* Navigation */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReturnToCustomer}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85 transition-colors hover:text-amber-400 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Customer Menu</span>
            </button>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/50 sm:text-xs">
              Staff Login
            </span>
          </div>

          {/* Header */}
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-900/40 ring-1 ring-white/20">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-2xl font-bold leading-tight text-white sm:text-3xl">
                {intended === 'admin' ? (
                  <>
                    Restaurant <span className="text-amber-400">Admin Portal</span>
                  </>
                ) : (
                  <>
                    Kitchen <span className="text-amber-400">Display System</span>
                  </>
                )}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-[15px]">{subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="staff-username" className="mb-1.5 block text-sm font-semibold text-white/95">
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/55">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="staff-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-3.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/30 sm:text-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-sm font-semibold text-white/95">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-white/55">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/30 sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-white/60 transition-colors hover:text-amber-400 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/30 transition-all duration-200 hover:scale-[1.02] hover:from-amber-400 hover:via-orange-400 hover:to-amber-400 hover:shadow-orange-700/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:from-stone-500 disabled:via-stone-500 disabled:to-stone-500 disabled:text-white/60 disabled:shadow-none disabled:hover:scale-100 sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <span>Signing in...</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Sign In to Staff Portal</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {demoMode && (
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3.5 text-xs text-amber-50/95 sm:text-sm">
                <strong className="text-amber-300">Demo Staff Credentials:</strong>
                <div className="mt-1.5 space-y-0.5 text-white/85">
                  <div>
                    Manager: <code className="font-mono text-amber-100">manager</code> /{' '}
                    <code className="font-mono text-amber-100">manager123</code>
                  </div>
                  <div>
                    Kitchen: <code className="font-mono text-amber-100">kitchen</code> /{' '}
                    <code className="font-mono text-amber-100">kitchen123</code>
                  </div>
                </div>
                <div className="mt-2 text-[11px] leading-relaxed text-white/60">
                  Only staff accounts can access the Admin and Kitchen portals. Customers ordering from a table QR code do
                  not need an account.
                </div>
              </div>
            )}
          </form>

          <div className="mt-7 border-t border-white/15 pt-5 text-center">
            <button
              type="button"
              onClick={onReturnToCustomer}
              className="text-sm font-medium text-white/80 transition-colors hover:text-amber-400 sm:text-base"
            >
              ← Continue as Guest (Customer Menu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
