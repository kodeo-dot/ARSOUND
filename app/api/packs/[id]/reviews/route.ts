import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET reviews for a pack
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()

    const { data: reviews, error } = await supabase
      .from("pack_reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        updated_at,
        user:profiles(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("pack_id", packId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, reviews })
  } catch (error: any) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST a new review
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { rating, comment } = await request.json()

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Rating debe estar entre 1 y 5" }, { status: 400 })
    }

    // Check if user has purchased or downloaded the pack
    const { data: hasPurchased } = await supabase
      .from("purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("pack_id", packId)
      .eq("status", "completed")
      .maybeSingle()

    const { data: hasDownloaded } = await supabase
      .from("pack_downloads")
      .select("id")
      .eq("user_id", user.id)
      .eq("pack_id", packId)
      .maybeSingle()

    if (!hasPurchased && !hasDownloaded) {
      return NextResponse.json(
        { success: false, error: "Debes descargar o comprar el pack para dejar una review" },
        { status: 403 },
      )
    }

    // Insert review
    const { data: review, error: insertError } = await supabase
      .from("pack_reviews")
      .insert({
        pack_id: packId,
        user_id: user.id,
        rating,
        comment,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Get pack owner to send notification
    const { data: pack } = await supabase.from("packs").select("user_id, title").eq("id", packId).single()

    if (pack && pack.user_id !== user.id) {
      // Create notification for pack owner
      await supabase.rpc("create_notification", {
        p_user_id: pack.user_id,
        p_type: "review",
        p_actor_id: user.id,
        p_pack_id: packId,
        p_metadata: { rating, pack_name: pack.title },
      })
    }

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error("Error creating review:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT update a review
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { rating, comment } = await request.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Rating debe estar entre 1 y 5" }, { status: 400 })
    }

    const { data: review, error } = await supabase
      .from("pack_reviews")
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString(),
      })
      .eq("pack_id", packId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error("Error updating review:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE a review
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { error } = await supabase.from("pack_reviews").delete().eq("pack_id", packId).eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting review:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
