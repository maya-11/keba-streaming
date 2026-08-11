import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Do NOT persist the session to localStorage — forces sign-in every
        // time the user closes and reopens the app/browser tab.
        persistSession: false,
        // Also clear any existing persisted session on init
        detectSessionInUrl: true,
      },
    }
  );
}
