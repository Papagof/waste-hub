"use server"

import { revalidatePath } from "next/cache"
import type { CollectionLog } from "@waste-hub/shared-types"
import { createClient } from "@/lib/supabase/server"

export interface FormActionState {
  error: string | null
}

export async function logCollection(
  communityId: string,
  _prevState: FormActionState,
  formData: FormData,
): Promise<FormActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from("collection_logs").insert({
    community_id: communityId,
    collector_id: user?.id ?? null,
    collection_date: (formData.get("collectionDate") as string) || new Date().toISOString().slice(0, 10),
    status: formData.get("status") as CollectionLog["status"],
    notes: (formData.get("notes") as string) || null,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/collections")
  return { error: null }
}
