import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@waste-hub/shared-types"

/** Supabase client for use in Client Components. Uses the publishable anon key only. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
