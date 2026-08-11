'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, CheckCircle2, XCircle } from 'lucide-react';

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-xs">
      {met ? (
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
      ) : (
        <XCircle className="h-3.5 w-3.5 shrink-0 text-dark-500" />
      )}
      <span className={met ? 'text-green-400' : 'text-dark-500'}>{label}</span>
    </li>
  );
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordStrong = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasMinLength) {
      toast.error('Your password must be at least 8 characters long.');
      return;
    }
    if (!passwordStrong) {
      toast.error('Your password must meet the minimum security requirements.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (
        msg.includes('already registered') ||
        msg.includes('already exists') ||
        msg.includes('email address is already')
      ) {
        toast.error('An account with this email already exists. Please log in instead.');
      } else if (msg.includes('invalid email') || msg.includes('valid email')) {
        toast.error('Please enter a valid email address.');
      } else if (msg.includes('weak password') || msg.includes('password should')) {
        toast.error('Your password must meet the minimum security requirements.');
      } else {
        toast.error(error.message || 'Registration failed. Please check your details and try again.');
      }
      setLoading(false);
      return;
    }

    // Supabase silently returns empty identities when the email is already registered
    if (data.user && !data.user.identities?.length) {
      toast.error('An account with this email already exists. Please log in instead.');
      setLoading(false);
      return;
    }

    // Email confirmation is OFF — session returned immediately
    if (data.session) {
      sessionStorage.setItem('keba_browser_session', 'true');
      toast.success('Welcome to Keba!');
      router.push('/browse');
      router.refresh();
      return;
    }

    // Email confirmation is ON
    setNeedsConfirmation(true);
    setLoading(false);
  };

  if (needsConfirmation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 block text-center text-3xl font-bold text-primary-500">
            KEBA
          </Link>
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
              Didn&apos;t receive it? Check your spam folder. The link expires in 24 hours.
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
        <Link href="/" className="mb-8 flex justify-center">
          <Image src="/keba-logo.jpg" alt="Keba Entertainmentz" width={72} height={72} className="rounded-sm object-contain" priority />
        </Link>
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
                autoComplete="name"
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
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
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

              {(passwordFocused || password.length > 0) && (
                <ul className="mt-2 space-y-1 rounded-lg bg-dark-800 p-3">
                  <PasswordRequirement met={hasMinLength} label="At least 8 characters" />
                  <PasswordRequirement met={hasUppercase} label="One uppercase letter" />
                  <PasswordRequirement met={hasLowercase} label="One lowercase letter" />
                  <PasswordRequirement met={hasNumber} label="One number" />
                </ul>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
