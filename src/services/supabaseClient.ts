import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dtazmnbqyskwywqepzhd.supabase.co';
const supabaseAnonKey = 'sb_publishable_OwzTarp6B6NSKyrNAx6Eog_I0dW6jsl';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
