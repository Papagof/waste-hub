"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { parseResidentsCsv } from "./csv"

export interface BulkImportRowFailure {
  rowNumber: number
  message: string
}

export interface BulkImportState {
  error: string | null
  successCount: number
  failures: BulkImportRowFailure[]
}

const initialState: BulkImportState = { error: null, successCount: 0, failures: [] }

export async function bulkImportResidents(
  communityId: string,
  _prevState: BulkImportState,
  formData: FormData,
): Promise<BulkImportState> {
  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) {
    return { ...initialState, error: "Choose a CSV file to upload." }
  }

  const text = await file.text()
  const { rows, errors: parseErrors } = parseResidentsCsv(text)

  if (rows.length === 0 && parseErrors.length > 0 && parseErrors[0].rowNumber <= 1) {
    // Whole-file problem (empty file / missing columns) — nothing to import.
    return { ...initialState, error: parseErrors[0].message }
  }

  const supabase = await createClient()

  const { data: billingPlans } = await supabase.from("billing_plans").select("id, name").eq("is_active", true)
  const planIdByName = new Map((billingPlans ?? []).map((p) => [p.name.trim().toLowerCase(), p.id]))

  const failures: BulkImportRowFailure[] = [...parseErrors]
  let successCount = 0

  for (const row of rows) {
    const billingPlanId = planIdByName.get(row.billingPlanName.toLowerCase())
    if (!billingPlanId) {
      failures.push({
        rowNumber: row.rowNumber,
        message: `No active billing plan named "${row.billingPlanName}".`,
      })
      continue
    }

    const { error } = await supabase.from("residents").insert({
      community_id: communityId,
      billing_plan_id: billingPlanId,
      full_name: row.fullName,
      house_unit_number: row.houseUnitNumber,
      phone: row.phone,
      email: row.email,
    })

    if (error) {
      failures.push({
        rowNumber: row.rowNumber,
        message: error.code === "23505" ? `Unit "${row.houseUnitNumber}" already has a resident.` : error.message,
      })
      continue
    }

    successCount++
  }

  if (successCount > 0) {
    revalidatePath(`/dashboard/communities/${communityId}`)
  }

  return { error: null, successCount, failures }
}
