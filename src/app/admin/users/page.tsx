'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Profile } from '@/types/database';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    } else {
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const toggleRole = async (user: Profile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`Role changed to ${newRole}`);
    } else {
      toast.error('Failed to update role');
    }
  };

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users ({users.length})</h1>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-64 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-dark-400">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-dark-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dark-700 bg-dark-900 text-dark-400">
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
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-dark-800/50">
                  <td className="px-4 py-3">{user.full_name || <span className="text-dark-500">—</span>}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-primary-900/40 text-primary-400'
                        : 'bg-dark-700 text-dark-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`capitalize ${
                      user.subscription_status === 'active' ? 'text-green-400' : 'text-dark-400'
                    }`}>
                      {user.subscription_status}
                      {user.subscription_plan ? ` · ${user.subscription_plan}` : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-dark-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRole(user)}
                      className="rounded px-2 py-1 text-xs hover:bg-dark-700 transition-colors"
                    >
                      {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
