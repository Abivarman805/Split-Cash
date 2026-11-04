import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://dtazmnbqyskwywqepzhd.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_OwzTarp6B6NSKyrNAx6Eog_I0dW6jsl';

let client: SupabaseClient;

try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
} catch {
  client = createClient(supabaseUrl, 'sb_publishable_OwzTarp6B6NSKyrNAx6Eog_I0dW6jsl');
}

export const supabase = client;