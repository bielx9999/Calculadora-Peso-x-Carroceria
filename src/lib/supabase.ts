import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let browserClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return browserClient
}

export function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null
  if (!serverClient) {
    serverClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
  }
  return serverClient
}
