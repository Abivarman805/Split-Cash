import { createClient } from '@supabase/supabase-js';

// Uses only public URL and public anon/publishable key. Never put service_role keys here.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://dtazmnbqyskwywqepzhd.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_OwzTarp6B6NSKyrNAx6Eog_I0dW6jsl';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});