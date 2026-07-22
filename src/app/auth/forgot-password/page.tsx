'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback?next=/auth/reset-password`
        : '/auth/callback?next=/auth/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('too many requests') || msg.includes('rate limit')) {
        toast.error('Too many requests. Please wait a few minutes before trying again.');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
      setLoading(false);
      return;
    }

    // Always show success — don't reveal whether the email exists
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
          KEBA
        </Link>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10">
                <Mail className="h-8 w-8 text-primary-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
              <p className="mb-4 text-dark-400">
                If an account exists for{' '}
                <span className="font-medium text-white">{email}</span>, we&apos;ve sent a
                password reset link. Check your inbox and click the link to reset your password.
              </p>
              <p className="mb-6 text-sm text-dark-500">
                Didn&apos;t receive it? Check your spam folder, or try again.
              </p>
              <button onClick={() => setSent(false)} className="btn-secondary w-full">
                Try a different email
              </button>
              <Link
                href="/auth/login"
                className="mt-4 block text-center text-sm text-dark-400 hover:text-white"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="mb-6 flex items-center gap-1 text-sm text-dark-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
              <h1 className="mb-2 text-2xl font-bold">Reset your password</h1>
              <p className="mb-6 text-sm text-dark-400">
                Enter the email address for your account and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-dark-300">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
