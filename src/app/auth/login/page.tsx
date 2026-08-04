'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Show error from auth callback (e.g. expired reset link) then clean the URL
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, '', '/auth/login');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        // Check if the email is registered so we can give a precise message
        try {
          const res = await fetch('/api/auth/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const { exists } = await res.json();
          if (exists) {
            toast.error('Incorrect password. Please try again or reset your password.');
          } else {
            toast.error('No account was found with this email. Please create an account first.');
          }
        } catch {
          toast.error('Incorrect email or password. Please try again.');
        }
      } else if (msg.includes('email not confirmed')) {
        toast.error('Please confirm your email address before signing in. Check your inbox.');
      } else if (msg.includes('too many requests')) {
        toast.error('Too many attempts. Please wait a few minutes and try again.');
      } else {
        toast.error('Sign in failed. Please check your details and try again.');
      }

      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push('/browse');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
          KEBA
        </Link>
        <div className="card p-8">
          <h1 className="mb-6 text-2xl font-bold">Sign In</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-dark-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Your password"
                  required
                  autoComplete="current-password"
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

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary-400 hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
