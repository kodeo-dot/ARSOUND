import { createServerClient } from "@/lib/supabase/server-client"
import { getUserPlan } from "@/lib/plans-actions"
import { PLAN_FEATURES, type PlanType } from "@/lib/plans"
import { hashFileFromUrl } from "@/lib/hash-file"
import { checkReuploadProtection } from "@/lib/reupload-protection"
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

    const body = await request.json()
    const {
      title,
      description,
      genre,
      subgenre,
      bpm,
      price,
      tags,
      cover_image_url,
      demo_audio_url,
      file_url,
      has_discount,
      discount_percent,
      discountCode,
      discountType,
    } = body

    if (!title || !description || !genre || !subgenre || price === undefined || !file_url) {
      const missingFields = []
      if (!title) missingFields.push("title")
      if (!description) missingFields.push("description")
      if (!genre) missingFields.push("genre")
      if (!subgenre) missingFields.push("subgenre")
      if (price === undefined) missingFields.push("price")
      if (!file_url) missingFields.push("file_url")

      return NextResponse.json(
        {
          error: "Validation failed",
          details: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields,
        },
        { status: 400 },
      )
    }

    if (!file_url.startsWith("https://")) {
      return NextResponse.json(
        {
          error: "Invalid file URL",
          details: "file_url must be a full HTTPS URL from Supabase Storage",
        },
        { status: 400 },
      )
    }

    let fileHash: string
    try {
      fileHash = await hashFileFromUrl(file_url)
    } catch (hashError) {
      console.error("[v0] Error generating file hash:", hashError)
      return NextResponse.json(
        {
          error: "Could not process file",
          details: "Failed to generate file hash. Please try again.",
        },
        { status: 500 },
      )
    }

    const { data: existingPack, error: existingPackError } = await supabase
      .from("packs")
      .select("id, user_id")
      .eq("file_hash", fileHash)
      .single()

    if (!existingPackError && existingPack) {
      // File hash already exists - check if it belongs to the same user
      if (existingPack.user_id !== user.id) {
        // Different user trying to upload the same file - check protection and block if needed
        const protectionResult = await checkReuploadProtection(user.id, fileHash, existingPack.user_id)

        if (!protectionResult.isAllowed) {
          return NextResponse.json(
            {
              error: "Duplicate file",
              message: protectionResult.message,
              errorCode: protectionResult.errorCode,
              attemptCount: protectionResult.attemptCount,
              isBlocked: protectionResult.isBlocked,
            },
            { status: protectionResult.isBlocked ? 403 : 403 },
          )
        }
      }
      // Same user re-uploading - allow it to proceed (can update metadata)
      console.log("[v0] User re-uploading their own pack with file_hash:", fileHash)
    }

    const { plan, error: planError } = await getUserPlan(user.id)

    if (planError) {
      return NextResponse.json(
        {
          error: "Could not verify user plan",
          details: planError,
        },
        { status: 500 },
      )
    }

    const planLimits = PLAN_FEATURES[plan as PlanType]

    const priceNum = Number.parseInt(price)
    if (priceNum > 0) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("mp_connected")
        .eq("id", user.id)
        .single()

      if (profileError || !profile?.mp_connected) {
        return NextResponse.json(
          {
            error: "Mercado Pago not connected",
            details:
              "Necesitás conectar tu cuenta de Mercado Pago para vender packs. Andá a tu perfil para conectarla.",
          },
          { status: 403 },
        )
      }
    }

    const { data: totalPacks, error: totalError } = await supabase.rpc("count_total_packs", {
      p_user_id: user.id,
    })

    if (totalError) {
      console.error("[v0] Error checking total packs:", totalError)
    }

    if (plan === "free" && planLimits.maxTotalPacks !== null && (totalPacks || 0) >= planLimits.maxTotalPacks) {
      return NextResponse.json(
        {
          error: "Upload limit reached",
          details: `Alcanzaste tu límite de ${planLimits.maxTotalPacks} packs totales en el plan FREE. Mejorá tu plan para subir más.`,
          current: totalPacks,
          limit: planLimits.maxTotalPacks,
        },
        { status: 403 },
      )
    }

    const { data: packsThisMonth, error: statsError } = await supabase.rpc("count_packs_this_month", {
      p_user_id: user.id,
    })

    if (statsError) {
      console.error("[v0] Error checking upload limit:", statsError)
      return NextResponse.json(
        {
          error: "Could not verify upload limit",
          details: "Failed to check your monthly upload quota",
        },
        { status: 500 },
      )
    }

    if (
      plan === "de_0_a_hit" &&
      planLimits.maxPacksPerMonth !== null &&
      (packsThisMonth || 0) >= planLimits.maxPacksPerMonth
    ) {
      return NextResponse.json(
        {
          error: "Upload limit reached",
          details: `Alcanzaste tu límite de ${planLimits.maxPacksPerMonth} packs por mes en el plan De 0 a Hit. Esperá al próximo mes o mejorá tu plan.`,
          current: packsThisMonth,
          limit: planLimits.maxPacksPerMonth,
        },
        { status: 403 },
      )
    }

    if (planLimits.maxPrice !== null && priceNum > planLimits.maxPrice) {
      return NextResponse.json(
        {
          error: "Price exceeds limit",
          details: `El precio máximo para tu plan ${plan} es $${planLimits.maxPrice.toLocaleString()} ARS.`,
          current: priceNum,
          limit: planLimits.maxPrice,
        },
        { status: 403 },
      )
    }

    if (has_discount && discount_percent) {
      const maxDiscount = planLimits.maxDiscountPercent
      if (Number.parseInt(discount_percent) > maxDiscount) {
        return NextResponse.json(
          {
            error: "Discount exceeds limit",
            details: `Tu plan ${plan} permite máximo ${maxDiscount}% de descuento.`,
            current: discount_percent,
            limit: maxDiscount,
          },
          { status: 403 },
        )
      }
    }

    const { data: pack, error: packError } = await supabase
      .from("packs")
      .insert({
        user_id: user.id,
        title,
        description,
        genre,
        subgenre,
        bpm: bpm || null,
        price: priceNum,
        cover_image_url: cover_image_url || null,
        demo_audio_url,
        file_url,
        tags: tags || [],
        has_discount: has_discount || false,
        discount_percent: has_discount ? Number.parseInt(discount_percent) : 0,
        file_hash: fileHash,
      })
      .select()
      .single()

    if (packError) {
      console.error("[v0] Error inserting pack:", packError)
      return NextResponse.json(
        {
          error: "Failed to create pack",
          details: `Database error: ${packError.message}`,
          code: packError.code,
        },
        { status: 500 },
      )
    }

    if (has_discount && discountCode && pack?.id) {
      console.log("[v0] Creating discount code:", {
        code: discountCode,
        pack_id: pack.id,
        discount_percent: Number.parseInt(discount_percent),
        type: discountType,
      })

      const { error: discountError } = await supabase.from("discount_codes").insert({
        pack_id: pack.id,
        code: discountCode.toUpperCase(),
        discount_percent: Number.parseInt(discount_percent),
        for_all_users: discountType === "all",
        for_first_purchase: discountType === "first",
        for_followers: discountType === "followers",
        max_uses: null,
        expires_at: null,
      })

      if (discountError) {
        console.error("[v0] Error creating discount code:", discountError)
      } else {
        console.log("[v0] Discount code created successfully")
      }
    }

    const { error: updateError } = await supabase.rpc("increment", {
      table_name: "profiles",
      row_id: user.id,
      column_name: "packs_count",
    })

    if (updateError) {
      console.error("[v0] Error updating packs_count:", updateError)
    }

    return NextResponse.json({
      success: true,
      pack,
      message: "Pack uploaded successfully",
    })
  } catch (error: any) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred during upload",
      },
      { status: 500 },
    )
  }
}
