'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Your password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      toast.error('Your password must meet the minimum security requirements.');
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
      } else if (msg.includes('weak password') || msg.includes('password should')) {
        toast.error('Your password must meet the minimum security requirements.');
      } else {
        toast.error('Failed to update password. Your reset link may have expired. Please request a new one.');
      }
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    // Sign out so the user logs in fresh with the new password
    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push('/auth/login');
    }, 3000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
          KEBA
        </Link>

        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Password updated!</h1>
              <p className="text-dark-400">
                Your password has been changed successfully. Redirecting you to sign in…
              </p>
            </div>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold">Set new password</h1>
              <p className="mb-6 text-sm text-dark-400">
                Choose a strong password for your account.
              </p>
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
                  {loading ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
