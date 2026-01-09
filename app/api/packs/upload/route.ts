import { requireSession } from "@/lib/auth/session"
import { getUserPlan, getProfile } from "@/lib/database/queries"
import { createServerClient } from "@/lib/supabase/server-client"
import { createAdminClient } from "@/lib/supabase/server-client"
import { hashFileFromUrl } from "@/lib/storage/file-hash"
import { checkReuploadProtection } from "@/lib/storage/reupload-protection"
import { validatePackUpload } from "@/lib/storage/pack-validator"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { handleApiError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { UploadPackRequest } from "@/lib/types/api.types"

export async function POST(request: Request) {
  try {
    console.log("[UPLOAD] Starting pack upload")

    // 1️⃣ Auth
    const user = await requireSession()
    console.log("[UPLOAD] User authenticated:", user.id)

    // 2️⃣ Body
    const body: UploadPackRequest = await request.json()
    console.log("[UPLOAD] Body received:", {
      title: body.title,
      price: body.price,
    })

    // 3️⃣ User plan + profile
    const [planType, profile] = await Promise.all([
      getUserPlan(user.id),
      getProfile(user.id),
    ])

    if (!profile) {
      return errorResponse("Profile not found", 404)
    }

    // 4️⃣ Mercado Pago validation
    if (body.price > 0 && !profile.mp_connected) {
      return errorResponse(
        "Necesitás conectar tu cuenta de Mercado Pago para vender packs.",
        403,
      )
    }

    // 5️⃣ Pack validation (limits, fields, etc)
    await validatePackUpload(user.id, planType, body)

    // 6️⃣ Hash file
    let fileHash: string
    try {
      fileHash = await hashFileFromUrl(body.file_url)
    } catch (err) {
      logger.error("File hash error", "UPLOAD", err)
      return errorResponse("Error al procesar el archivo", 500)
    }

    // 7️⃣ Duplicate check (🔥 FIX REAL ACÁ)
    const supabase = await createServerClient()

    const { data: existingPack, error: existingPackError } = await supabase
      .from("packs")
      .select("id, user_id")
      .eq("file_hash", fileHash)
      .maybeSingle()

    if (existingPackError) {
      console.error("[UPLOAD] Duplicate check error:", existingPackError)
    }

    if (existingPack && existingPack.user_id !== user.id) {
      const protection = await checkReuploadProtection(
        user.id,
        fileHash,
        existingPack.user_id,
      )

      if (!protection.isAllowed) {
        return errorResponse(
          protection.message || "Duplicate file detected",
          protection.isBlocked ? 403 : 400,
        )
      }
    }

    // 8️⃣ Create pack (ADMIN)
    const adminSupabase = await createAdminClient()


    const { data: pack, error: packError } = await adminSupabase
      .from("packs")
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        genre: body.genre,
        subgenre: body.subgenre,
        bpm: body.bpm || null,
        price: body.price,
        cover_image_url: body.cover_image_url || null,
        demo_audio_url: body.demo_audio_url,
        file_url: body.file_url,
        tags: body.tags || [],
        has_discount: body.has_discount || false,
        discount_percent: body.has_discount
          ? body.discount_percent || 0
          : 0,
        file_hash: fileHash,
        status: "published",
      })
      .select()
      .single()

    if (packError || !pack) {
      logger.error("Pack insert error", "UPLOAD", packError)
      return errorResponse("Error al crear el pack", 500)
    }

    // 9️⃣ Discount code
    if (body.has_discount && body.discountCode) {
      const { error: discountError } = await adminSupabase
        .from("discount_codes")
        .insert({
          pack_id: pack.id,
          code: body.discountCode.toUpperCase(),
          discount_percent: body.discount_percent || 0,
          for_all_users: body.discountType === "all",
          for_first_purchase: body.discountType === "first",
          for_followers: body.discountType === "followers",
        })

      if (discountError) {
        console.error("[UPLOAD] Discount error:", discountError)
      }
    }

    // 🔟 Increment counter (no crítico)
    try {
      await adminSupabase.rpc("increment_pack_count", {
        user_id_input: user.id,
      })
    } catch (err) {
      console.warn("[UPLOAD] Counter increment failed:", err)
    }

    logger.info("Pack uploaded", "UPLOAD", {
      packId: pack.id,
      userId: user.id,
    })

    return successResponse(
      {
        pack,
        message: "Pack subido exitosamente",
      },
      undefined,
      201,
    )
  } catch (error) {
    console.error("[UPLOAD] Fatal error:", error)
    const details = handleApiError(error)
    logger.error("Upload fatal error", "UPLOAD", details)
    return errorResponse(
      details.message,
      details.statusCode,
      details.details,
    )
  }
}
