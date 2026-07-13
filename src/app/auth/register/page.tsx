'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('email address is already')) {
        toast.error('An account with this email already exists. Please sign in instead.');
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // Supabase silently succeeds when email already exists (no error returned)
    // but returns an identityData of null — detect this case
    if (data.user && !data.user.identities?.length) {
      toast.error('An account with this email already exists. Please sign in instead.');
      setLoading(false);
      return;
    }

    // If Supabase returned a session immediately, email confirmation is OFF
    // → log the user straight in
    if (data.session) {
      toast.success('Welcome to Keba!');
      router.push('/browse');
      return;
    }

    // Email confirmation is ON — show the "check your email" screen
    setNeedsConfirmation(true);
    setLoading(false);
  };

  // "Check your email" screen shown when confirmation is required
  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">KEBA</Link>
          <div className="card p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10">
              <Mail className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
            <p className="mb-4 text-dark-400">
              We sent a confirmation link to{' '}
              <span className="font-medium text-white">{email}</span>.
              Click the link in the email to activate your account.
            </p>
            <p className="mb-6 text-sm text-dark-500">
              Didn't get it? Check your spam folder. The link expires in 24 hours.
            </p>
            <Link href="/auth/login" className="btn-secondary block w-full text-center">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">KEBA</Link>
        <div className="card p-8">
          <h1 className="mb-6 text-2xl font-bold">Create Account</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-dark-300">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
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
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
