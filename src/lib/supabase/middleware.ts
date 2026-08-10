import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const pathname = request.nextUrl.pathname;

  // ── Intercept recovery codes BEFORE creating the Supabase client ──
  // Supabase sends the reset link to the Site URL (/?code=...) when
  // redirectTo isn't in the dashboard's allowed-redirect list.
  // We must redirect immediately — before getUser() — so the SSR
  // client never touches the one-time PKCE code and invalidates it.
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const code = request.nextUrl.searchParams.get('code')!;
    return NextResponse.redirect(new URL(`/auth/reset-password?code=${code}`, request.url));
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isResetPage = pathname === '/auth/reset-password';
  const isForgotPage = pathname === '/auth/forgot-password';
  const isAuthPage = pathname.startsWith('/auth') && !isResetPage && !isForgotPage;
  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminPage = pathname.startsWith('/admin') && !isAdminLoginPage;
  const isProtectedPage =
    pathname.startsWith('/browse') ||
    pathname.startsWith('/watch') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/my-list') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/title') ||
    pathname.startsWith('/series') ||
    pathname.startsWith('/notifications');

  if (!user && isProtectedPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/browse', request.url));
  }

  // Admin pages: let the login page handle its own auth check
  // Only protect non-login admin pages at middleware level
  if (isAdminPage) {
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    // Don't block here — let the page itself verify admin role
    // This avoids RLS issues in middleware
  }

  return response;
}
