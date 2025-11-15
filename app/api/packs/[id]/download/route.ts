import { createServerClient } from "@/lib/supabase/server-client"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: packId } = await context.params
    const supabase = await createServerClient()

    console.log("[v0] Download request for pack:", packId)

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[v0] User not authenticated:", userError)
      return NextResponse.json(
        { error: "Necesitás iniciar sesión para descargar este pack" },
        { status: 401 }
      )
    }

    console.log("[v0] User authenticated:", user.id)

    // Get pack details
    const { data: pack, error: packError } = await supabase
      .from("packs")
      .select("id, title, price, file_url, user_id")
      .eq("id", packId)
      .single()

    if (packError || !pack) {
      console.error("[v0] Pack not found:", packError)
      return NextResponse.json({ error: "Pack no encontrado" }, { status: 404 })
    }

    console.log("[v0] Pack found:", { id: pack.id, price: pack.price, title: pack.title })

    const isFree = !pack.price || pack.price === 0

    // Check permissions for paid packs
    if (!isFree) {
      const { data: purchase } = await supabase
        .from("purchases")
        .select("id")
        .eq("pack_id", packId)
        .eq("buyer_id", user.id)
        .eq("status", "completed")
        .single()

      if (!purchase) {
        console.log("[v0] User has not purchased this pack")
        return NextResponse.json(
          { error: "Necesitás comprar este pack para descargarlo" },
          { status: 403 }
        )
      }
      console.log("[v0] User has purchased pack")
    } else {
      const { data: limits } = await supabase.rpc("get_download_limit", {
        p_user_id: user.id,
      })

      console.log("[v0] Download limits:", limits)

      if (limits && limits.limit !== "unlimited" && limits.remaining <= 0) {
        return NextResponse.json(
          {
            error: "Alcanzaste el límite de descargas gratuitas este mes",
            current: limits.used,
            limit: limits.limit,
          },
          { status: 403 }
        )
      }
    }

    // Extract file path from URL
    const url = new URL(pack.file_url)
    const cleanPath = url.pathname.split("/samplepacks/")[1]

    console.log("[v0] Downloading file from path:", cleanPath)

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("samplepacks")
      .download(cleanPath)

    if (downloadError || !fileData) {
      console.error("[v0] Error downloading file:", downloadError)
      return NextResponse.json(
        { error: "Error al descargar el archivo" },
        { status: 500 }
      )
    }

    console.log("[v0] File downloaded successfully")

    const { error: recordError } = await supabase
      .from("pack_downloads")
      .insert({
        user_id: user.id,
        pack_id: packId,
        downloaded_at: new Date().toISOString(),
      })

    if (recordError) {
      console.error("[v0] Error recording download:", recordError)
    } else {
      console.log("[v0] Download recorded successfully")
    }

    const { error: incrementError } = await supabase.rpc("increment", {
      table_name: "packs",
      row_id: packId,
      column_name: "downloads_count",
    })

    if (incrementError) {
      console.error("[v0] Error incrementing download counter:", incrementError)
    } else {
      console.log("[v0] Download counter incremented")
    }

    // Return file
    const buffer = await fileData.arrayBuffer()
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${pack.title
          .replace(/[^a-zA-Z0-9]/g, "_")
          .replace(/_+/g, "_")}.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json(
      { error: "Error al procesar la descarga" },
      { status: 500 }
    )
  }
}
