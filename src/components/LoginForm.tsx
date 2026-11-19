import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChefHat,
  AlertCircle,
  Eye,
  EyeOff,
  UtensilsCrossed,
} from 'lucide-react';
import adminBg from '../assets/images/admin-login-bg.jpg';

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
    <div className="relative min-h-screen w-full overflow-hidden bg-[#120a05]">
      {/* Full-screen blurred restaurant background (local asset) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat blur-2xl sm:blur-3xl transform-gpu"
        style={{ backgroundImage: `url(${adminBg})` }}
      />
      {/* Warm dark overlay for readability */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1a0f08]/75 via-[#2a1407]/65 to-[#0f0906]/80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,146,60,0.12),transparent_60%)]"
      />

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[440px] rounded-3xl border border-white/15 bg-[#1b120c]/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl backdrop-saturate-150 sm:p-8">
          {/* Navigation */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onReturnToCustomer}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 transition-colors hover:text-amber-400 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Customer Menu</span>
            </button>
            <span className="font-mono text-[10px] uppercase tracking-wider text-white/45 sm:text-xs">Staff Login</span>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-900/30 ring-1 ring-amber-300/30">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif text-xl font-bold leading-tight text-white sm:text-2xl">{title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/70 sm:text-sm">{subtitle}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff-username" className="mb-1.5 block text-xs font-semibold text-white/90 sm:text-sm">
                Username
              </label>
              <input
                id="staff-username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label htmlFor="staff-password" className="mb-1.5 block text-xs font-semibold text-white/90 sm:text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-white/15 bg-white/10 px-3.5 py-2.5 pr-11 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-white/60 transition-colors hover:text-amber-400 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/15 p-3 text-xs text-red-100 sm:text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-900/30 transition-all hover:bg-amber-400 hover:shadow-amber-700/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/50 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <span>Signing in...</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Sign In to Staff Portal</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {demoMode && (
              <div className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-50/95">
                <strong className="text-amber-200">Demo Staff Credentials:</strong>
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
                <div className="mt-2 text-[10px] leading-relaxed text-white/55 sm:text-[11px]">
                  Only staff accounts can access the Admin and Kitchen portals. Customers ordering from a table QR code do
                  not need an account.
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <button
              type="button"
              onClick={onReturnToCustomer}
              className="text-sm font-medium text-white/75 transition-colors hover:text-amber-400"
            >
              ← Continue as Guest (Customer Menu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
