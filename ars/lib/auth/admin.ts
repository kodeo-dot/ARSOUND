import { createServerClient } from "../database/supabase.client"
import type { UserRole } from "../types/database.types"

export async function checkAdminRole(userId: string): Promise<UserRole> {
  const supabase = await createServerClient()

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single()

  return (profile?.role as UserRole) || "user"
}

export async function isAdmin(userId: string): Promise<boolean> {
  const role = await checkAdminRole(userId)
  return role === "admin"
}

export async function isModerator(userId: string): Promise<boolean> {
  const role = await checkAdminRole(userId)
  return role === "admin" || role === "moderator"
}

export async function logAdminAction(
  adminId: string,
  actionType: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>,
): Promise<void> {
  const supabase = await createServerClient()

  await supabase.from("admin_actions").insert({
    admin_id: adminId,
    action_type: actionType,
    target_type: targetType,
    target_id: targetId,
    details: details || null,
  })
}
