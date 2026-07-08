'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Profile } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', user.id);
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
    toast.success(`Role changed to ${newRole}`);
  };

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users ({users.length})</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-dark-700 text-dark-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-dark-800/50">
                <td className="px-4 py-3">{user.full_name || '-'}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${user.role === 'admin' ? 'bg-primary-900/30 text-primary-400' : 'bg-dark-700 text-dark-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize">{user.subscription_status}</td>
                <td className="px-4 py-3 text-dark-400">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleRole(user)} className="rounded px-2 py-1 text-xs hover:bg-dark-700">
                    {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
