// supabase.ts — lazily-created Supabase client.
//
// Lazy on purpose: createClient throws if the URL/key are missing, so we only
// build it when the env vars are present and someone actually asks for it. That
// keeps the app running on the edge server / mock when Supabase isn't configured.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/** True when both Supabase env vars are set. */
export const hasSupabase = !!(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)

/** Get (or create) the shared client. Throws if env vars are missing. */
export function getSupabase(): SupabaseClient {
  if (client) return client
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase env vars are not set')
  client = createClient(url, key)
  return client
}
