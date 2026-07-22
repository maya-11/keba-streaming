'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Supabase sends auth errors (expired OTP, access denied, etc.) to the Site URL (/).
// This component reads those error params and redirects to the login page
// with a clean, user-friendly message.
export function SupabaseErrorRedirect() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));

    const errorCode = params.get('error_code') || hash.get('error_code');
    const errorDesc = params.get('error_description') || hash.get('error_description');

    if (!errorCode) return;

    let message = 'Something went wrong. Please try again.';

    if (errorCode === 'otp_expired') {
      message = 'This password reset link has expired. Please request a new one.';
    } else if (errorCode === 'access_denied') {
      message = 'Access denied. Please request a new link.';
    } else if (errorDesc) {
      message = errorDesc.replace(/\+/g, ' ');
    }

    router.replace(`/auth/login?error=${encodeURIComponent(message)}`);
  }, []);

  return null;
}
