'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', price: 0, interval: 'month' as 'month' | 'year',
    features: '' , max_screens: 1, max_quality: '720p', download_allowed: false, is_active: true,
  });
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('subscription_plans').select('*').order('price');
    setPlans(data || []);
    setLoading(false);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({ name: plan.name, slug: plan.slug, price: plan.price, interval: plan.interval, features: plan.features.join(', '), max_screens: plan.max_screens, max_quality: plan.max_quality, download_allowed: plan.download_allowed, is_active: plan.is_active });
    setShowModal(true);
  };

  const save = async () => {
    const payload = { ...form, features: form.features.split(',').map((f) => f.trim()).filter(Boolean), slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') };
    if (editing) {
      await supabase.from('subscription_plans').update(payload).eq('id', editing.id);
      toast.success('Plan updated');
    } else {
      await supabase.from('subscription_plans').insert(payload);
      toast.success('Plan created');
    }
    setShowModal(false); setEditing(null); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    await supabase.from('subscription_plans').delete().eq('id', id);
    toast.success('Deleted'); load();
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', slug: '', price: 0, interval: 'month', features: '', max_screens: 1, max_quality: '720p', download_allowed: false, is_active: true }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className={`card p-6 ${!plan.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold">${plan.price}<span className="text-sm text-dark-400">/{plan.interval}</span></p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(plan)} className="rounded p-1 hover:bg-dark-700"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(plan.id)} className="rounded p-1 text-red-400 hover:bg-dark-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-2 text-sm text-dark-400">{plan.max_screens} screens, {plan.max_quality}</p>
            <ul className="mt-2 space-y-1 text-sm text-dark-300">
              {plan.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Plan' : 'Add Plan'}>
        <div className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            <div><label className="mb-1 block text-sm text-dark-300">Name</label><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" /></div>
            <div><label className="mb-1 block text-sm text-dark-300">Price</label><input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) }))} className="input-field" /></div>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div><label className="mb-1 block text-sm text-dark-300">Interval</label><select value={form.interval} onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value as 'month' | 'year' }))} className="input-field"><option value="month">Monthly</option><option value="year">Yearly</option></select></div>
            <div><label className="mb-1 block text-sm text-dark-300">Max Screens</label><input type="number" value={form.max_screens} onChange={(e) => setForm((f) => ({ ...f, max_screens: parseInt(e.target.value) }))} className="input-field" /></div>
          </div>
          <div><label className="mb-1 block text-sm text-dark-300">Max Quality</label><input type="text" value={form.max_quality} onChange={(e) => setForm((f) => ({ ...f, max_quality: e.target.value }))} className="input-field" /></div>
          <div><label className="mb-1 block text-sm text-dark-300">Features (comma-separated)</label><input type="text" value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} className="input-field" /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.download_allowed} onChange={(e) => setForm((f) => ({ ...f, download_allowed: e.target.checked }))} /> Downloads</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active</label>
          </div>
          <button onClick={save} className="btn-primary w-full">{editing ? 'Update' : 'Create'}</button>
        </div>
      </Modal>
    </div>
  );
}
