import { requireSession } from "@/lib/auth/session"
import { getUserPlan, getProfile } from "@/lib/database/queries"
import { createServerClient, createAdminClient } from "@/lib/database/supabase.client"
import { hashFileFromUrl } from "@/lib/storage/file-hash"
import { checkReuploadProtection } from "@/lib/storage/reupload-protection"
import { validatePackUpload } from "@/lib/storage/pack-validator"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { handleApiError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { UploadPackRequest } from "@/lib/types/api.types"

export async function POST(request: Request) {
  try {
    const user = await requireSession()
    const body: UploadPackRequest = await request.json()

    // Get user plan and profile
    const [planType, profile] = await Promise.all([getUserPlan(user.id), getProfile(user.id)])

    if (!profile) {
      return errorResponse("Profile not found", 404)
    }

    // Validate if user can sell (needs Mercado Pago for paid packs)
    if (body.price > 0 && !profile.mp_connected) {
      return errorResponse(
        "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil para conectarla.",
        403,
      )
    }

    // Validate pack data and plan limits
    await validatePackUpload(user.id, planType, body)

    // Generate file hash
    let fileHash: string
    try {
      fileHash = await hashFileFromUrl(body.file_url)
    } catch (error) {
      logger.error("Error generating file hash", "UPLOAD", error)
      return errorResponse("Error al procesar el archivo. Intentá de nuevo.", 500)
    }

    // Check for duplicate files
    const supabase = await createServerClient()
    const { data: existingPack } = await supabase.from("packs").select("id, user_id").eq("file_hash", fileHash).single()

    if (existingPack && existingPack.user_id !== user.id) {
      const protectionResult = await checkReuploadProtection(user.id, fileHash, existingPack.user_id)

      if (!protectionResult.isAllowed) {
        return errorResponse(
          protectionResult.message || "Duplicate file detected",
          protectionResult.isBlocked ? 403 : 400,
        )
      }
    }

    // Create pack
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
        discount_percent: body.has_discount ? body.discount_percent || 0 : 0,
        file_hash: fileHash,
        status: "published",
      })
      .select()
      .single()

    if (packError || !pack) {
      logger.error("Error creating pack", "UPLOAD", packError)
      return errorResponse("Error al crear el pack", 500)
    }

    // Create discount code if applicable
    if (body.has_discount && body.discountCode && pack.id) {
      const { error: discountError } = await adminSupabase.from("discount_codes").insert({
        pack_id: pack.id,
        code: body.discountCode.toUpperCase(),
        discount_percent: body.discount_percent || 0,
        for_all_users: body.discountType === "all",
        for_first_purchase: body.discountType === "first",
        for_followers: body.discountType === "followers",
        max_uses: null,
        expires_at: null,
      })

      if (discountError) {
        logger.error("Error creating discount code", "UPLOAD", discountError)
      }
    }

    // Increment pack counter
    await adminSupabase.rpc("increment", {
      table_name: "profiles",
      row_id: user.id,
      column_name: "packs_count",
    })

    logger.info("Pack uploaded successfully", "UPLOAD", {
      packId: pack.id,
      userId: user.id,
      price: pack.price,
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
    const errorDetails = handleApiError(error)
    logger.error("Upload error", "UPLOAD", errorDetails)
    return errorResponse(errorDetails.message, errorDetails.statusCode, errorDetails.details)
  }
}
