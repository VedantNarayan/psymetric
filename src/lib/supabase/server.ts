import { createClient } from '@supabase/supabase-js';

export function createServerSupabase(authHeader?: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
  // Use service role if available on server, otherwise fallback to anon key
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      'placeholder-key-for-build-safety';

  const options: any = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  };

  if (authHeader) {
    options.global = {
      headers: {
        Authorization: authHeader
      }
    };
  }

  return createClient(supabaseUrl, supabaseKey, options);
}
