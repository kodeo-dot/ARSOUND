import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET questions for a pack
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: packId } = await context.params
    const supabase = await createClient()

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

    const { question } = await request.json()

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ success: false, error: "La pregunta no puede estar vacía" }, { status: 400 })
    }

    console.log("[v0] Creating question for pack:", packId)

    const { data: newQuestion, error } = await supabase
      .from("pack_questions")
      .insert({
        pack_id: packId,
        user_id: user.id,
        question: question.trim(),
      })
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
        )
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating question:", error)
      throw error
    }

    console.log("[v0] Question created successfully:", newQuestion.id)
    // Notification is created automatically by the trigger

    return NextResponse.json({ success: true, question: newQuestion })
  } catch (error: any) {
    console.error("[v0] Error in POST questions:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
