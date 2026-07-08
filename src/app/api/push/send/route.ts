import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';

webpush.setVapidDetails(
  `mailto:admin@${process.env.NEXT_PUBLIC_APP_URL || 'localhost'}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function POST(request: NextRequest) {
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
