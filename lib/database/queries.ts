import { createServerClient, createAdminClient } from "./supabase.client"
import type { Profile, Pack, DiscountCode, PlanType } from "../types/database.types"

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("[DB] Error fetching profile:", error)
    return null
  }

  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
  const supabase = await createServerClient()

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

  if (error) {
    console.error("[DB] Error updating profile:", error)
    return false
  }

  return true
}

export async function getUserPlan(userId: string): Promise<PlanType> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("user_plans")
    .select("plan_type")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[DB] Error fetching user plan:", error)
    return "free"
  }

  // Check if plan is expired
  if (data?.expires_at) {
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      return "free"
    }
  }

  return (data?.plan_type as PlanType) || "free"
}

export async function updateUserPlan(userId: string, planType: PlanType, expiresAt?: Date | null): Promise<boolean> {
  const supabase = await createAdminClient()

  // Update user_plans table
  const { error: userPlanError } = await supabase.from("user_plans").upsert(
    {
      user_id: userId,
      plan_type: planType,
      is_active: true,
      started_at: new Date().toISOString(),
      expires_at: expiresAt?.toISOString() ?? null,
    },
    {
      onConflict: "user_id",
      ignoreDuplicates: false,
    },
  )

  if (userPlanError) {
    console.error("[DB] Error updating user_plans:", userPlanError)
    return false
  }

  // Also update profiles.plan to keep in sync (primary source of truth)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plan: planType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    console.error("[DB] Error updating profile plan:", profileError)
    return false
  }

  return true
}

export async function getPackById(packId: string): Promise<Pack | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase.from("packs").select("*").eq("id", packId).single()

  if (error) {
    console.error("[DB] Error fetching pack:", error)
    return null
  }

  return data
}

export async function checkPackPurchase(userId: string, packId: string): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  const { data } = await adminSupabase
    .from("purchases")
    .select("id")
    .eq("buyer_id", userId)
    .eq("pack_id", packId)
    .eq("status", "completed")
    .single()

  return !!data
}

export async function createPurchase(purchase: {
  buyer_id: string
  seller_id: string
  pack_id: string
  amount: number
  paid_price: number // Actual price paid (with discount)
  base_amount: number // Original price before discount
  discount_amount: number
  platform_commission: number
  creator_earnings: number
  payment_method: string
  mercado_pago_payment_id?: string
  seller_mp_user_id?: string
  purchase_code: string
}): Promise<string | null> {
  const adminSupabase = await createAdminClient()

  const { data, error } = await adminSupabase
    .from("purchases")
    .insert({
      ...purchase,
      status: "completed",
    })
    .select("id")
    .single()

  if (error) {
    console.error("[DB] Error creating purchase:", error)
    return null
  }

  return data.id
}

export async function recordDownload(userId: string, packId: string): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  const { error } = await adminSupabase.from("pack_downloads").insert({
    user_id: userId,
    pack_id: packId,
    downloaded_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[DB] Error recording download:", error)
    return false
  }

  return true
}

export async function incrementPackCounter(
  packId: string,
  field: "downloads_count" | "total_plays" | "likes_count",
): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  const { error } = await adminSupabase.rpc("increment", {
    table_name: "packs",
    row_id: packId,
    column_name: field,
  })

  if (error) {
    console.error(`[DB] Error incrementing ${field}:`, error)
    return false
  }

  return true
}

export async function getDiscountCode(packId: string, code: string): Promise<DiscountCode | null> {
  const supabase = await createServerClient()

  const { data, error } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("pack_id", packId)
    .eq("code", code.toUpperCase())
    .single()

  if (error) {
    return null
  }

  return data
}

export async function incrementDiscountCodeUsage(codeId: string): Promise<boolean> {
  const supabase = await createServerClient()

  const { data: code } = await supabase.from("discount_codes").select("uses_count").eq("id", codeId).single()

  if (!code) return false

  const { error } = await supabase
    .from("discount_codes")
    .update({ uses_count: (code.uses_count || 0) + 1 })
    .eq("id", codeId)

  return !error
}

export async function countUserPacks(userId: string): Promise<{
  total: number
  thisMonth: number
}> {
  const supabase = await createServerClient()

  const { count: total } = await supabase
    .from("packs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonth } = await supabase
    .from("packs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString())

  return {
    total: total || 0,
    thisMonth: thisMonth || 0,
  }
}
