import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@waste-hub/shared-types"

/**
 * Service-role client that bypasses RLS. Server-only — never import this
 * from a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the
 * browser. Reserved for trusted server contexts with no user session to
 * scope the request to, such as gateway webhook handlers.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
