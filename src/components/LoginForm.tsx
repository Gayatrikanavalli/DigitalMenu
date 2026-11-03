import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, ArrowLeft, ChefHat, AlertCircle } from 'lucide-react';

export type LoginIntended = 'admin' | 'kitchen';

interface LoginFormProps {
  intended: LoginIntended;
  onLogin: (username: string, password: string) => void;
  onReturnToCustomer: () => void;
  error?: string;
  demoMode?: boolean;
}

const VIEW_LABELS: Record<LoginIntended, { title: string; subtitle: string; icon: React.ElementType }> = {
  admin: {
    title: 'Restaurant Admin Portal',
    subtitle: 'Restricted access for restaurant managers and administrators.',
    icon: ShieldCheck,
  },
  kitchen: {
    title: 'Kitchen Display System',
    subtitle: 'Restricted access for kitchen staff to view and update orders.',
    icon: ChefHat,
  },
};

function ChefHatPlaceholder() {
  return null;
}

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
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 max-w-md w-full p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
            {Icon ? <Icon className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 font-serif">{title}</h2>
            <p className="text-xs text-stone-500">{subtitle}</p>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onReturnToCustomer}
            className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Customer Menu</span>
          </button>
          <span className="text-[10px] text-stone-400 font-mono">Staff Login</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Username</label>
            <input
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-amber-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-1.5 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <>
                <span className="flex items-center gap-1.5">
                  Signing in...
                  <ArrowRight className="w-3 h-3" />
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  Sign In to Staff Portal
                  <ArrowRight className="w-3 h-3" />
                </span>
              </>
            )}
          </button>

          {demoMode && (
            <div className="p-3 bg-amber-50 rounded-lg text-amber-900 text-xs border border-amber-100">
              <strong>Demo Staff Credentials:</strong>
              <div className="mt-1">
                <div>Manager: <code className="font-mono">manager</code> / <code className="font-mono">manager123</code></div>
                <div>Kitchen: <code className="font-mono">kitchen</code> / <code className="font-mono">kitchen123</code></div>
              </div>
              <div className="mt-2 text-[10px] text-stone-500">
                Only staff accounts can access the Admin and Kitchen portals. Customers ordering from a table QR
                code do not need an account.
              </div>
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-stone-200 text-center">
          <button
            onClick={onReturnToCustomer}
            className="text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            ← Continue as Guest (Customer Menu)
          </button>
        </div>
      </div>
    </div>
  );
}
