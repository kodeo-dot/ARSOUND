import { createBrowserClient } from "@/lib/supabase/client"
import { createServerClient, createAdminClient } from "@/lib/supabase/server"
import type { UserAction } from "@/types/user-actions"

/**
 * Check if a user has already performed an action on a pack
 */
export async function hasUserAction(
  userId: string,
  packId: string,
  actionType: 'play' | 'download' | 'purchase' | 'like'
): Promise<boolean> {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('user_actions')
    .select('id')
    .eq('user_id', userId)
    .eq('pack_id', packId)
    .eq('action_type', actionType)
    .maybeSingle()

  if (error) {
    console.error('[v0] Error checking user action:', error)
    return false
  }

  return !!data
}

/**
 * Record a user action (play, download, purchase, like)
 * Returns true if action was recorded, false if it already existed
 */
export async function recordUserAction(
  userId: string,
  packId: string,
  actionType: 'play' | 'download' | 'purchase' | 'like'
): Promise<boolean> {
  const supabase = createBrowserClient()

  // Check if action already exists
  const exists = await hasUserAction(userId, packId, actionType)
  if (exists) {
    console.log(`[v0] Action ${actionType} already recorded for user ${userId} on pack ${packId}`)
    return false
  }

  // Insert new action
  const { error } = await supabase
    .from('user_actions')
    .insert({
      user_id: userId,
      pack_id: packId,
      action_type: actionType,
    })

  if (error) {
    // Handle unique constraint violation gracefully
    if (error.code === '23505') {
      console.log(`[v0] Action ${actionType} already exists (race condition)`)
      return false
    }
    console.error('[v0] Error recording user action:', error)
    return false
  }

  console.log(`[v0] Action ${actionType} recorded for user ${userId} on pack ${packId}`)
  return true
}

/**
 * Server-side version using admin client
 */
export async function recordUserActionServer(
  userId: string,
  packId: string,
  actionType: 'play' | 'download' | 'purchase' | 'like'
): Promise<boolean> {
  const adminSupabase = await createAdminClient()

  // Check if action already exists
  const { data: existing } = await adminSupabase
    .from('user_actions')
    .select('id')
    .eq('user_id', userId)
    .eq('pack_id', packId)
    .eq('action_type', actionType)
    .maybeSingle()

  if (existing) {
    console.log(`[v0] Action ${actionType} already recorded for user ${userId} on pack ${packId}`)
    return false
  }

  // Insert new action
  const { error } = await adminSupabase
    .from('user_actions')
    .insert({
      user_id: userId,
      pack_id: packId,
      action_type: actionType,
    })

  if (error) {
    if (error.code === '23505') {
      console.log(`[v0] Action ${actionType} already exists (race condition)`)
      return false
    }
    console.error('[v0] Error recording user action:', error)
    return false
  }

  console.log(`[v0] Action ${actionType} recorded for user ${userId} on pack ${packId}`)
  return true
}
