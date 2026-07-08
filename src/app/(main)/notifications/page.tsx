'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [subscribed, setSubscribed] = useState(false);
  const [supported, setSupported] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    setSupported('Notification' in window && 'serviceWorker' in navigator);
    checkSubscription();
  }, [user]);

  const checkSubscription = async () => {
    if (!user || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    } catch {}
  };

  const subscribe = async () => {
    if (!user) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { toast.error('Notification permission denied'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const subJson = sub.toJSON();
      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: subJson.keys as any,
      }, { onConflict: 'endpoint' });

      setSubscribed(true);
      toast.success('Push notifications enabled');
    } catch (err) {
      toast.error('Failed to enable notifications');
    }
  };

  const unsubscribe = async () => {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', sub.endpoint);
      }
      setSubscribed(false);
      toast.success('Push notifications disabled');
    } catch {
      toast.error('Failed to disable notifications');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="mb-8 text-3xl font-bold">Notifications</h1>
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {subscribed ? <Bell className="h-6 w-6 text-primary-500" /> : <BellOff className="h-6 w-6 text-dark-400" />}
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-dark-400">
                {subscribed ? 'You will receive notifications about new content.' : 'Enable to get notified about new releases.'}
              </p>
            </div>
          </div>
          {supported && (
            <button onClick={subscribed ? unsubscribe : subscribe} className={subscribed ? 'btn-secondary' : 'btn-primary'}>
              {subscribed ? 'Disable' : 'Enable'}
            </button>
          )}
        </div>
        {!supported && <p className="mt-4 text-sm text-dark-500">Push notifications are not supported in this browser.</p>}
      </div>
    </div>
  );
}
