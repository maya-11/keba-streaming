'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ConfirmPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const type = params.get('type');

    if (!code) {
      setStatus('error');
      setMessage('Invalid confirmation link. Please request a new one.');
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        setStatus('error');
        setMessage('This confirmation link has expired or already been used. Please request a new one.');
        return;
      }

      if (data.session) {
        // Set the session flag so use-auth doesn't immediately sign them out
        sessionStorage.setItem('keba_browser_session', 'true');
        setStatus('success');

        if (type === 'email_change') {
          setMessage('Your email address has been updated successfully.');
        } else {
          setMessage('Your account has been confirmed! Taking you to Keba…');
        }

        setTimeout(() => router.push('/browse'), 2000);
      }
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center">
          <Image src="/keba-logo.jpg" alt="Keba Entertainmentz" width={72} height={72} className="rounded-sm object-contain" priority />
        </Link>

        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <h1 className="text-xl font-bold">Confirming your account…</h1>
              <p className="mt-2 text-sm text-dark-400">Just a moment please.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">You're confirmed!</h1>
              <p className="text-dark-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="mb-2 text-2xl font-bold">Link expired</h1>
              <p className="mb-6 text-dark-400">{message}</p>
              <Link href="/auth/register" className="btn-primary block w-full text-center">
                Create account again
              </Link>
              <Link href="/auth/login" className="mt-3 block text-center text-sm text-dark-400 hover:text-white">
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
