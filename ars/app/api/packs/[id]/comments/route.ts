import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET comments for a pack
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()

    console.log("[v0] Fetching comments for pack:", packId)

    // Get all comments with user data and replies
    const { data: comments, error } = await supabase
      .from("pack_comments")
      .select(`
        id,
        comment,
        parent_id,
        created_at,
        updated_at,
        user:profiles!pack_comments_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq("pack_id", packId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching comments:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Organize comments into threads (parent comments with their replies)
    const commentMap = new Map()
    const topLevelComments: any[] = []

    // First pass: create map of all comments
    comments?.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into hierarchy
    comments?.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies.push(commentMap.get(comment.id))
        }
      } else {
        topLevelComments.push(commentMap.get(comment.id))
      }
    })

    console.log("[v0] Found", topLevelComments.length, "top-level comments")

    return NextResponse.json({ success: true, comments: topLevelComments })
  } catch (error: any) {
    console.error("[v0] Error in GET /comments:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST new comment
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { comment, parentId } = body

    if (!comment?.trim()) {
      return NextResponse.json({ success: false, error: "El comentario no puede estar vacío" }, { status: 400 })
    }

    console.log("[v0] Creating comment for pack:", packId, "user:", user.id, "parent:", parentId)

    const { data, error } = await supabase
      .from("pack_comments")
      .insert({
        pack_id: packId,
        user_id: user.id,
        parent_id: parentId || null,
        comment: comment.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating comment:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("[v0] Comment created successfully:", data.id)

    return NextResponse.json({ success: true, comment: data })
  } catch (error: any) {
    console.error("[v0] Error in POST /comments:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE comment
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json({ success: false, error: "commentId requerido" }, { status: 400 })
    }

    const { error } = await supabase.from("pack_comments").delete().eq("id", commentId).eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
