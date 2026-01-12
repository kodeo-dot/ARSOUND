import { createServerClient } from "@/lib/database/supabase.client"

export async function recordProfileView(profileId: string, viewerId: string): Promise<boolean> {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase.rpc("record_profile_view", {
      p_profile_id: profileId,
      p_viewer_id: viewerId,
    })

    if (error) {
      console.error("[ARSOUND] Error recording profile view:", error)
      return false
    }

    return data || false
  } catch (error) {
    console.error("[ARSOUND] Error recording profile view:", error)
    return false
  }
}
