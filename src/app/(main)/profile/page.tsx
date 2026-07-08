'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { User, CreditCard, Bell, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const supabase = createClient();
  const router = useRouter();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);
    if (error) toast.error('Failed to update profile');
    else {
      toast.success('Profile updated');
      setProfile({ ...profile!, full_name: fullName });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <h1 className="mb-8 text-3xl font-bold">Profile</h1>

      <div className="space-y-6">
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Account Details</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-dark-300">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Email</label>
              <input type="email" value={user?.email || ''} disabled className="input-field opacity-60" />
            </div>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Subscription</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              {profile?.subscription_status === 'active' && profile?.subscription_plan ? (
                <>
                  <span className="inline-block rounded-full bg-primary-600/20 px-2.5 py-0.5 text-xs font-semibold text-primary-400 mb-1">Active</span>
                  <p className="font-semibold">{profile.subscription_plan} Plan</p>
                  {profile.subscription_end && (
                    <p className="text-sm text-dark-400">
                      Renews {new Date(profile.subscription_end).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-dark-300">Free Plan</p>
                  <p className="text-sm text-dark-500">Upgrade to unlock HD streaming and more.</p>
                </>
              )}
            </div>
            <Link href="/profile/subscription" className="btn-secondary text-sm">
              {profile?.subscription_status === 'active' ? 'Manage' : 'Upgrade'}
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary-500" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <Link href="/notifications" className="btn-secondary text-sm">Manage Notifications</Link>
        </div>
      </div>
    </div>
  );
}
