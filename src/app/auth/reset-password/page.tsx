'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'no-session' | 'done';

export default function ResetPasswordPage() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Register the auth state listener BEFORE exchanging the code.
    // This eliminates the race condition where the PASSWORD_RECOVERY or
    // SIGNED_IN event fires before the listener is registered.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setPageState('ready');
      } else if (event === 'SIGNED_OUT') {
        // Only treat as no-session if we're still waiting (loading state).
        // Ignore SIGNED_OUT triggered by our own signOut() call after success.
        setPageState((prev) => (prev === 'loading' ? 'no-session' : prev));
      }
    });

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          setPageState('no-session');
          return;
        }
        // Belt-and-suspenders: also set ready here in case the auth event
        // was emitted before the listener above was registered.
        if (data.session) {
          setPageState('ready');
        }
        // Remove the one-time code from the URL so it cannot be reused
        window.history.replaceState({}, '', '/auth/reset-password');
      });
    } else {
      // No code — check for an existing session (e.g. after page refresh)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setPageState(session ? 'ready' : 'no-session');
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      toast.error('Password must contain an uppercase letter, a lowercase letter, and a number.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('same password') || msg.includes('different from')) {
        toast.error('Your new password must be different from your current password.');
      } else {
        toast.error('Failed to update password. Your reset link may have expired. Please request a new one.');
      }
      setLoading(false);
      return;
    }

    // Mark success BEFORE signing out to prevent the SIGNED_OUT listener
    // from overwriting this state with 'no-session'.
    setPageState('done');

    await supabase.auth.signOut();

    setTimeout(() => router.push('/auth/login'), 2500);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  // ── Expired / invalid link ───────────────────────────────────────────────
  if (pageState === 'no-session') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
            KEBA
          </Link>
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Link expired</h1>
            <p className="mb-6 text-dark-400">
              This password reset link has expired or has already been used.
              Please request a new one.
            </p>
            <Link href="/auth/forgot-password" className="btn-primary block w-full text-center">
              Request new link
            </Link>
            <Link
              href="/auth/login"
              className="mt-4 block text-center text-sm text-dark-400 hover:text-white"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (pageState === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
            KEBA
          </Link>
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Password updated!</h1>
            <p className="text-dark-400">
              Your password has been changed successfully. Redirecting you to sign in…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Reset form ───────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
          KEBA
        </Link>
        <div className="card p-8">
          <h1 className="mb-2 text-2xl font-bold">Set new password</h1>
          <p className="mb-6 text-sm text-dark-400">Choose a strong password for your account.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-dark-300">New password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoFocus
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Confirm new password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Repeat your new password"
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
