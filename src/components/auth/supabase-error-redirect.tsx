'use client';

import { useEffect } from 'react';

// Supabase sends auth redirects to the Site URL (/) when the emailRedirectTo
// URL isn't yet in the dashboard's allowed-redirect list.
// This component catches those params and routes them to the correct page.
export function SupabaseErrorRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));

    // ?code= means a PKCE recovery code landed here instead of /auth/reset-password.
    // Forward it so the reset-password page can exchange it client-side.
    const code = params.get('code');
    if (code) {
      window.location.replace(`/auth/reset-password?code=${encodeURIComponent(code)}`);
      return;
    }

    // Error params from Supabase (expired OTP, access denied, etc.)
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

    window.location.replace(`/auth/login?error=${encodeURIComponent(message)}`);
  }, []);

  return null;
}
