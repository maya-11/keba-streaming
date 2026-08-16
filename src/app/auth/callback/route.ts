import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side auth callback handler.
 *
 * All Supabase email links (password reset, confirmation, magic link) land
 * here first. The server exchanges the one-time code for a session using
 * cookies — no PKCE verifier in localStorage needed. This works regardless
 * of which browser or device the user clicks the link from.
 *
 * Configure this as the Redirect URL in Supabase:
 *   https://keba-streaming.vercel.app/auth/callback
 */
// Only allow redirecting to a same-origin relative path — a `next` value
// like `https://evil.example` or `//evil.example` would otherwise send a
// freshly-authenticated session straight to an attacker-controlled site.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/browse';
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = safeNextPath(searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url));
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent('Link expired or already used. Please request a new one.')}`, request.url)
    );
  }

  // Route by type
  if (type === 'recovery') {
    // Password reset — send to the reset form (session is now set in cookies)
    return NextResponse.redirect(new URL('/auth/reset-password', request.url));
  }

  // Signup confirmation, magic link, email change — go to browse
  return NextResponse.redirect(new URL(next, request.url));
}
