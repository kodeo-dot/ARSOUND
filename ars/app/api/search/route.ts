import { createAdminClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse } from "@/lib/utils/response"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()

    if (!query || query.length < 2) {
      return errorResponse("Query debe tener al menos 2 caracteres", 400)
    }

    const supabase = await createAdminClient()
    const searchTerm = `%${query}%`

    // Search packs by title, genre, tags, and creator username
    const { data: packs, error: packsError } = await supabase
      .from("packs")
      .select(`
        id,
        title,
        genre,
        subgenre,
        product_type,
        price,
        cover_image_url,
        tags,
        user_id,
        profiles!inner (
          username,
          display_name
        )
      `)
      .or(`title.ilike.${searchTerm},genre.ilike.${searchTerm},tags.cs.{${query}}`)
      .eq("is_deleted", false)
      .limit(20)

    // Search packs by creator username
    const { data: packsByCreator, error: creatorPacksError } = await supabase
      .from("packs")
      .select(`
        id,
        title,
        genre,
        subgenre,
        product_type,
        price,
        cover_image_url,
        tags,
        user_id,
        profiles!inner (
          username,
          display_name
        )
      `)
      .ilike("profiles.username", searchTerm)
      .eq("is_deleted", false)
      .limit(20)

    // Search users by username
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, packs_count")
      .ilike("username", searchTerm)
      .limit(10)

    if (packsError || creatorPacksError || usersError) {
      console.error("Search errors:", { packsError, creatorPacksError, usersError })
      return errorResponse("Error en la búsqueda", 500)
    }

    // Combine and deduplicate packs
    const allPacks = [...(packs || []), ...(packsByCreator || [])]
    const uniquePacks = Array.from(new Map(allPacks.map((pack) => [pack.id, pack])).values())

    return successResponse({
      packs: uniquePacks,
      users: users || [],
      query,
      totalResults: uniquePacks.length + (users?.length || 0),
    })
  } catch (error) {
    console.error("Search error:", error)
    return errorResponse("Error interno del servidor", 500)
  }
}
