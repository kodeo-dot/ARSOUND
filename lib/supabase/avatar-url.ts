import { createClient } from "@/lib/supabase/client"

/**
 * Get a public avatar URL for a user
 * @param avatarUrl - The stored avatar URL from database
 * @returns The public URL or a fallback placeholder
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  if (!avatarUrl) {
    return "/diverse-avatars.png"
  }

  // If it's already a full public URL, return as-is
  if (avatarUrl.startsWith("http")) {
    return avatarUrl
  }

  // If it's a relative path, construct the full URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return "/diverse-avatars.png"
  }

  // Return the public URL from Supabase storage
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarUrl}`
}

/**
 * Get a signed avatar URL for private access (if needed)
 * @param userId - The user ID
 * @param expiresIn - Expiration time in seconds (default 3600 = 1 hour)
 * @returns A signed URL or fallback
 */
export async function getSignedAvatarUrl(
  userId: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(`${userId}`, expiresIn)

    if (error || !data?.signedUrl) {
      return "/diverse-avatars.png"
    }

    return data.signedUrl
  } catch (error) {
    console.error("[v0] Error creating signed avatar URL:", error)
    return "/diverse-avatars.png"
  }
}
