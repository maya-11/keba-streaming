import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient, createServerSupabaseClient } from '@/lib/supabase/server';

webpush.setVapidDetails(
  `mailto:admin@${process.env.NEXT_PUBLIC_APP_URL || 'localhost'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Only admins can broadcast a push notification to every subscribed user.
async function verifyAdmin() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return (profile as any)?.role === 'admin';
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { title, body, url } = await request.json();
  const supabase = createAdminClient();

  const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');

  const results = await Promise.allSettled(
    (subscriptions || []).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys as any },
        JSON.stringify({ title, body, url })
      ).catch(async (err) => {
        if (err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      })
    )
  );

  return NextResponse.json({ sent: results.length });
}
