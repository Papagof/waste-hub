import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Handles the `code` param Supabase's OAuth/magic-link (PKCE) flow sends.
// See also ../confirm/route.ts for the token_hash email-confirmation flow.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(next)
    }
  }

  redirect("/login?error=confirmation-failed")
}
