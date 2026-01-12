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

    console.log("[v0] Creating review for pack:", packId)

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

    const { data: review, error: insertError } = await supabase
      .from("pack_reviews")
      .insert({
        pack_id: packId,
        user_id: user.id,
        rating,
        comment,
      })
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
      .single()

    if (insertError) {
      console.error("[v0] Error creating review:", insertError)
      throw insertError
    }

    console.log("[v0] Review created successfully:", review.id)
    // Notification is created automatically by the trigger

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error("[v0] Error in POST reviews:", error)
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
