'use client';

import { useEffect } from 'react';

// Supabase sends all auth redirects (codes AND errors) to the Site URL (/)
// when the redirectTo URL isn't in the dashboard's allowed list.
// This component intercepts those params and routes them correctly.
export function SupabaseErrorRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));

    // A ?code= means Supabase sent a PKCE auth code here instead of /auth/callback.
    // Use window.location.href (full page nav) so the API route is actually invoked —
    // router.replace() doesn't follow server-side redirects from API routes.
    const code = params.get('code');
    if (code) {
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=/auth/reset-password`;
      return;
    }

    // Error params — redirect to login with a clean message
    const errorCode = params.get('error_code') || hash.get('error_code');
    const errorDesc = params.get('error_description') || hash.get('error_description');

    if (!errorCode) return;

    let message = 'Something went wrong. Please try again.';
    if (errorCode === 'otp_expired') {
      message = 'This password reset link has expired. Please request a new one.';
    } else if (errorCode === 'access_denied') {
      message = 'Access denied. Please request a new link.';
    } else if (errorDesc) {
      message = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
    }

    window.location.href = `/auth/login?error=${encodeURIComponent(message)}`;
  }, []);

  return null;
}
