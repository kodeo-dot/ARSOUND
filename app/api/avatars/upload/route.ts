import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit", size: file.size },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single()

    if (profile?.avatar_url) {
      const oldFileName = profile.avatar_url.split("/").pop()
      if (oldFileName) {
        await supabase.storage
          .from("avatars")
          .remove([oldFileName])
          .catch(() => {
            // Silently fail if file doesn't exist
          })
      }
    }

    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${user.id}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("[v0] Avatar upload error:", uploadError)
      return NextResponse.json(
        {
          error: "Failed to upload avatar",
          details: uploadError.message,
        },
        { status: 500 }
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(fileName)

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Could not generate public URL" },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Profile update error:", updateError)
      return NextResponse.json(
        {
          error: "Failed to update profile",
          details: updateError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatar_url: publicUrl,
      message: "Avatar uploaded successfully",
    })
  } catch (error: any) {
    console.error("[v0] Avatar upload error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
