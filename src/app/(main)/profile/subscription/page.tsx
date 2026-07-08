'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth-store';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check, CreditCard, AlertCircle, X } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/database';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  plan: SubscriptionPlan;
  onConfirm: () => void;
  onClose: () => void;
}

function PaymentPlaceholderModal({ plan, onConfirm, onClose }: PaymentModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary-500" />
            <h2 className="text-xl font-bold">Payment</h2>
          </div>
          <button onClick={onClose} className="text-dark-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment placeholder notice */}
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Payment integration coming soon</p>
              <p className="mt-1 text-xs text-yellow-400/70">
                Real payment processing will be added in a future version. For now,
                selecting a plan will activate it immediately for demo purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-dark-800 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-dark-300">Plan</span>
            <span className="font-medium">{plan.name}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-dark-300">Billing</span>
            <span className="font-medium capitalize">{plan.interval}ly</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-dark-700 pt-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-primary-400">
              ${plan.price}/{plan.interval}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            Activate Plan
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const { user, profile } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const supabase = createClient();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data } = await (supabase as any)
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price');
    setPlans(data || []);
    setLoading(false);
  };

  const confirmSubscribe = async () => {
    if (!user || !pendingPlan) return;
    setSaving(true);

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (pendingPlan.interval === 'year' ? 12 : 1));

    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: pendingPlan.name,
        subscription_end: endDate.toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to activate plan. Please try again.');
    } else {
      setProfile({
        ...profile!,
        subscription_status: 'active',
        subscription_plan: pendingPlan.name,
        subscription_end: endDate.toISOString(),
      });
      toast.success(`${pendingPlan.name} plan activated!`);
    }

    setSaving(false);
    setPendingPlan(null);
  };

  const handleCancel = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        subscription_status: 'cancelled',
        subscription_plan: null,
        subscription_end: null,
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to cancel subscription.');
    } else {
      setProfile({
        ...profile!,
        subscription_status: 'cancelled',
        subscription_plan: null,
        subscription_end: null,
      });
      toast.success('Subscription cancelled.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const hasActiveSub =
    profile?.subscription_status === 'active' && !!profile?.subscription_plan;

  return (
    <>
      {pendingPlan && (
        <PaymentPlaceholderModal
          plan={pendingPlan}
          onConfirm={confirmSubscribe}
          onClose={() => setPendingPlan(null)}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="mb-2 text-3xl font-bold">Choose Your Plan</h1>
        <p className="mb-8 text-dark-400">
          Select the plan that works for you. Upgrade or downgrade anytime.
        </p>

        {/* Payment notice banner */}
        <div className="mb-8 flex items-start gap-3 rounded-lg border border-dark-700 bg-dark-900 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-dark-400 mt-0.5" />
          <p className="text-sm text-dark-400">
            <span className="font-medium text-dark-200">Demo mode:</span> Payment
            processing will be integrated in a future version. Plans activate
            immediately for demonstration purposes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent =
              profile?.subscription_plan === plan.name && hasActiveSub;
            return (
              <div
                key={plan.id}
                className={`card relative flex flex-col p-6 ${
                  isCurrent ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {isCurrent && (
                  <span className="mb-4 inline-block self-start rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold">
                    Current Plan
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="my-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-dark-400">/{plan.interval}</span>
                </div>
                <p className="mb-1 text-sm text-dark-400">
                  Up to {plan.max_quality} quality
                </p>
                <p className="mb-4 text-sm text-dark-400">
                  {plan.max_screens} screen{plan.max_screens > 1 ? 's' : ''}
                </p>
                <ul className="mb-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-primary-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => !isCurrent && setPendingPlan(plan)}
                  disabled={isCurrent || saving}
                  className={isCurrent ? 'btn-secondary w-full' : 'btn-primary w-full'}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : saving
                    ? 'Processing...'
                    : hasActiveSub
                    ? 'Switch Plan'
                    : 'Select Plan'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Cancel subscription */}
        {hasActiveSub && (
          <div className="mt-10 rounded-lg border border-dark-700 bg-dark-900 p-6">
            <h3 className="mb-1 font-semibold">Cancel Subscription</h3>
            <p className="mb-4 text-sm text-dark-400">
              Your subscription will be cancelled immediately. You can resubscribe at any time.
            </p>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {saving ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
