'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function useAuth() {
  const { user, profile, loading, setUser, setProfile, setLoading } = useAuthStore();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Force sign-in every browser session.
        // sessionStorage is cleared when the browser/tab is closed, so a
        // returning user who has no flag set gets signed out immediately and
        // must authenticate again — satisfying the manager's requirement.
        const SESSION_KEY = 'keba_browser_session';
        const hasActiveSession = sessionStorage.getItem(SESSION_KEY);

        if (!hasActiveSession) {
          // New browser session — sign out and hard-redirect.
          // Do NOT call setLoading(false) — keep the spinner visible so the
          // browse page never flashes before the redirect fires.
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          window.location.replace('/auth/login');
          return;
        }
      }

      setUser(user);
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading, supabase };
}
