import { createServerClient } from "@/lib/supabase/server"
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

    // Get pack details - use regular client since SELECT is allowed for everyone
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

    const { data: purchase, error: purchaseError } = await supabase
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
    console.log("[v0] User has purchased pack:", purchase.id)

    await supabase.from("pack_downloads").insert({
      user_id: user.id,
      pack_id: packId,
      downloaded_at: new Date().toISOString(),
    })

    await supabase.rpc("increment_counter", {
      table_name: "packs",
      row_id: packId,
      column_name: "downloads_count",
    }).catch((err) => {
      console.error("[v0] Error incrementing downloads_count:", err)
    })

    console.log("[v0] Download recorded and counter incremented")

    // Extract file path from URL
    const url = new URL(pack.file_url)
    const cleanPath = url.pathname.split("/samplepacks/")[1]

    console.log("[v0] Downloading file from path:", cleanPath)

    // Download file from storage - use admin client
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
