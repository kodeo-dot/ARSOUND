import { requireSession } from "@/lib/auth/session"
import { createServerClient } from "@/lib/database/supabase.client"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"
import type { PurchaseDetailsResponse } from "@/lib/types/api.types"

export async function GET() {
  try {
    const user = await requireSession()
    const supabase = await createServerClient()

    const { data: purchases, error } = await supabase
      .from("purchases")
      .select(
        `
        id,
        pack_id,
        amount,
        discount_amount,
        status,
        purchase_code,
        created_at,
        packs (
          id,
          title,
          cover_image_url,
          user_id,
          profiles (
            username
          )
        )
      `,
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      logger.error("Error fetching purchases", "API", error)
      return errorResponse("Failed to fetch purchases", 500)
    }

    // Transform data to match expected response
    const transformedPurchases: PurchaseDetailsResponse[] = purchases.map((purchase: any) => ({
      id: purchase.id,
      pack_title: purchase.packs?.title || "Unknown",
      pack_cover_image: purchase.packs?.cover_image_url || null,
      seller_username: purchase.packs?.profiles?.username || "Unknown",
      amount: purchase.amount,
      status: purchase.status,
      purchase_code: purchase.purchase_code,
      created_at: purchase.created_at,
    }))

    return successResponse({
      purchases: transformedPurchases,
    })
  } catch (error) {
    logger.error("Error in purchases details endpoint", "API", error)
    return errorResponse("Internal server error", 500)
  }
}
