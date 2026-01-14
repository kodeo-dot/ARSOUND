import { getMercadoPagoConfig } from "./config"
import { logger } from "../../utils/logger"

interface TransferData {
  amount: number
  receiver_id: string
  description: string
  external_reference: string
}

export async function createTransferToSeller(
  sellerMpUserId: string,
  amount: number,
  purchaseId: string,
  packTitle: string,
): Promise<{ transfer_id: string; status: string } | null> {
  const config = getMercadoPagoConfig()

  console.log("[v0] 💸 Creating transfer to seller", {
    sellerMpUserId,
    amount: `$${amount.toFixed(2)}`,
    purchaseId,
    packTitle,
  })

  try {
    const transferData: TransferData = {
      amount: amount,
      receiver_id: sellerMpUserId,
      description: `Venta de pack: ${packTitle}`,
      external_reference: `transfer_${purchaseId}`,
    }

    console.log("[v0] 📤 Transfer request data:", transferData)

    const response = await fetch("https://api.mercadopago.com/v1/money-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(transferData),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] ❌ Transfer failed:", error)
      logger.error("Failed to create transfer", "MP_TRANSFER", error)
      return null
    }

    const transfer = await response.json()

    console.log("[v0] ✅ Transfer created successfully", {
      transferId: transfer.id,
      status: transfer.status,
      amount: transfer.amount,
    })

    logger.info("Transfer created to seller", "MP_TRANSFER", {
      transferId: transfer.id,
      sellerMpUserId,
      amount,
      purchaseId,
    })

    return {
      transfer_id: transfer.id,
      status: transfer.status,
    }
  } catch (error) {
    console.error("[v0] ❌ Error creating transfer:", error)
    logger.error("Error creating transfer", "MP_TRANSFER", { error, sellerMpUserId, amount })
    return null
  }
}
