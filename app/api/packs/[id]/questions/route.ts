import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET questions for a pack
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const packId = params.id

    const { data: questions, error } = await supabase
      .from("pack_questions")
      .select(`
        id,
        question,
        created_at,
        updated_at,
        user:profiles!pack_questions_user_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        answers:pack_answers(
          id,
          answer,
          is_pack_owner,
          created_at,
          user:profiles!pack_answers_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        )
      `)
      .eq("pack_id", packId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, questions })
  } catch (error: any) {
    console.error("Error fetching questions:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST a new question
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const packId = params.id
    const { question } = await request.json()

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ success: false, error: "La pregunta no puede estar vacía" }, { status: 400 })
    }

    const { data: newQuestion, error } = await supabase
      .from("pack_questions")
      .insert({
        pack_id: packId,
        user_id: user.id,
        question: question.trim(),
      })
      .select()
      .single()

    if (error) throw error

    // Get pack owner to send notification
    const { data: pack } = await supabase.from("packs").select("user_id, title").eq("id", packId).single()

    if (pack && pack.user_id !== user.id) {
      // Create notification for pack owner
      await supabase.rpc("create_notification", {
        p_user_id: pack.user_id,
        p_type: "question",
        p_actor_id: user.id,
        p_pack_id: packId,
        p_metadata: { pack_name: pack.title, question: question.substring(0, 100) },
      })
    }

    return NextResponse.json({ success: true, question: newQuestion })
  } catch (error: any) {
    console.error("Error creating question:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
