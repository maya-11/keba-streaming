'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDebugInfo('');

    // Step 1: Sign in
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      toast.error(authError.message);
      setDebugInfo('Auth error: ' + authError.message);
      setLoading(false);
      return;
    }

    setDebugInfo('Signed in as: ' + authData.user.id);

    // Step 2: Read profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      setDebugInfo('Profile error: ' + profileError.message + ' | code: ' + profileError.code);
      toast.error('Could not load profile: ' + profileError.message);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setDebugInfo('Profile found: ' + JSON.stringify(profile));

    if (profile?.role !== 'admin') {
      toast.error('Access denied. Your role is: ' + (profile?.role || 'none'));
      setDebugInfo('Role is not admin, it is: ' + profile?.role);
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // Mark this browser tab as an active session so use-auth's "force
    // sign-in every visit" check doesn't treat this as a stale session and
    // immediately sign the admin back out (see auth/login/page.tsx).
    sessionStorage.setItem('keba_browser_session', 'true');
    toast.success('Welcome, Admin!');
    router.push('/admin');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold text-primary-500">KEBA</h1>
        <p className="mb-8 text-center text-dark-400">Admin Portal</p>
        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-dark-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-dark-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {debugInfo && (
            <div className="mt-4 rounded-lg bg-dark-800 p-3 text-xs text-dark-300 break-all">
              <p className="mb-1 font-semibold text-yellow-400">Debug Info:</p>
              {debugInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
