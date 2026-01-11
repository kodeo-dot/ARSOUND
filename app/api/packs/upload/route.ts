import { requireSession } from "@/lib/auth/session"
import { getUserPlan, getProfile } from "@/lib/database/queries"
import { createAdminClient } from "@/lib/database/supabase.client"
import { validatePackUpload } from "@/lib/storage/pack-validator"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { handleApiError } from "@/lib/utils/errors"
import { logger } from "@/lib/utils/logger"
import type { UploadPackRequest } from "@/lib/types/api.types"

export async function POST(request: Request) {
  try {
    console.log("[v0] Starting pack upload")

    let user
    try {
      user = await requireSession()
      console.log("[v0] User authenticated:", user.id)
    } catch (authError) {
      console.error("[v0] Auth error:", authError)
      return errorResponse("No autenticado", 401)
    }

    let body: UploadPackRequest
    try {
      body = await request.json()
      console.log("[v0] Request body received:", {
        title: body.title,
        price: body.price,
        product_type: body.product_type,
      })
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError)
      return errorResponse("Request inválido", 400)
    }

    // Get user plan and profile
    console.log("[v0] Fetching user plan and profile")
    const [planType, profile] = await Promise.all([
      getUserPlan(user.id).catch((err) => {
        console.error("[v0] Error getting plan:", err)
        return "free" as const
      }),
      getProfile(user.id).catch((err) => {
        console.error("[v0] Error getting profile:", err)
        return null
      }),
    ])

    console.log("[v0] Plan type:", planType, "Profile found:", !!profile)

    if (!profile) {
      return errorResponse("Perfil no encontrado", 404)
    }

    // Validate if user can sell (needs Mercado Pago for paid packs)
    if (body.price > 0 && !profile.mp_connected) {
      return errorResponse(
        "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil para conectarla.",
        403,
      )
    }

    console.log("[v0] Validating pack upload")
    try {
      await validatePackUpload(user.id, planType, body)
      console.log("[v0] Validation passed")
    } catch (validationError: any) {
      console.error("[v0] Validation error:", validationError)
      return errorResponse(validationError.message || "Error de validación", 400)
    }

    // Create pack
    console.log("[v0] Creating pack in database")
    const adminSupabase = await createAdminClient()

    const { data: pack, error: packError } = await adminSupabase
      .from("packs")
      .insert({
        user_id: user.id,
        title: body.title,
        description: body.description,
        genre: body.genre,
        subgenre: body.subgenre || null,
        bpm: body.bpm || null,
        product_type: body.product_type || "sample_pack",
        daw_compatibility: body.daw_compatibility || [],
        plugin: body.plugin || null,
        price: body.price,
        cover_image_url: body.cover_image_url || null,
        demo_audio_url: body.demo_audio_url,
        file_url: body.file_url,
        tags: body.tags || [],
        has_discount: body.has_discount || false,
        discount_percent: body.has_discount ? body.discount_percent || 0 : 0,
        is_deleted: false,
      })
      .select()
      .single()

    if (packError || !pack) {
      console.error("[v0] Error creating pack:", packError)
      logger.error("Error creating pack", "UPLOAD", packError)
      return errorResponse(packError?.message || "Error al crear el pack", 500)
    }

    console.log("[v0] Pack created successfully:", pack.id)

    if (body.has_discount && body.discountRequiresCode && body.discountCode && pack.id) {
      console.log("[v0] Creating discount code")
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
        console.error("[v0] Error creating discount code:", discountError)
        logger.error("Error creating discount code", "UPLOAD", discountError)
      }
    }

    logger.info("Pack uploaded successfully", "UPLOAD", {
      packId: pack.id,
      userId: user.id,
      price: pack.price,
    })

    console.log("[v0] Upload complete")
    return successResponse(
      {
        pack,
        message: "Pack subido exitosamente",
      },
      undefined,
      201,
    )
  } catch (error) {
    console.error("[v0] Upload error:", error)
    const errorDetails = handleApiError(error)
    logger.error("Upload error", "UPLOAD", errorDetails)
    return errorResponse(errorDetails.message, errorDetails.statusCode, errorDetails.details)
  }
}
