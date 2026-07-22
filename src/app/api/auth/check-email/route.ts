import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/auth/check-email — returns whether an email is registered
// Used by the login page to give accurate error messages
export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data } = await (admin as any)
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
