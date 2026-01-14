import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST a new answer
export async function POST(request: Request, context: { params: Promise<{ id: string; questionId: string }> }) {
  try {
    const { id: packId, questionId } = await context.params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 })
    }

    const { answer } = await request.json()

    if (!answer || answer.trim().length === 0) {
      return NextResponse.json({ success: false, error: "La respuesta no puede estar vacía" }, { status: 400 })
    }

    // Check if user is pack owner
    const { data: pack } = await supabase.from("packs").select("user_id").eq("id", packId).single()

    const isPackOwner = pack?.user_id === user.id

    const { data: newAnswer, error } = await supabase
      .from("pack_answers")
      .insert({
        question_id: questionId,
        user_id: user.id,
        answer: answer.trim(),
        is_pack_owner: isPackOwner,
      })
      .select()
      .single()

    if (error) throw error

    // Get question owner to send notification
    const { data: question } = await supabase
      .from("pack_questions")
      .select("user_id, question")
      .eq("id", questionId)
      .single()

    if (question && question.user_id !== user.id) {
      // Create notification for question asker
      await supabase.rpc("create_notification", {
        p_user_id: question.user_id,
        p_type: "answer",
        p_actor_id: user.id,
        p_pack_id: packId,
        p_metadata: {
          question: question.question.substring(0, 100),
          answer: answer.substring(0, 100),
          is_pack_owner: isPackOwner,
        },
      })
    }

    return NextResponse.json({ success: true, answer: newAnswer })
  } catch (error: any) {
    console.error("Error creating answer:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
