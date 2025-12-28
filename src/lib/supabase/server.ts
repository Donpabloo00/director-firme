import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client (pages/ directory safe)
 * NU foloseste next/headers - e incompatibil cu pages/ router
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

