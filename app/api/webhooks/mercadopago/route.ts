import { getPaymentDetails, processPayment } from "@/lib/payments/mercadopago/webhook"
import { successResponse, errorResponse } from "@/lib/utils/response"
import { logger } from "@/lib/utils/logger"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, data } = body

    logger.info("Webhook received", "MP_WEBHOOK", { type, dataId: data?.id })

    if (type !== "payment") {
      logger.debug("Webhook type is not payment, ignoring", "MP_WEBHOOK")
      return successResponse({ received: true })
    }

    const paymentId = data.id

    if (!paymentId) {
      logger.warn("Webhook received without payment ID", "MP_WEBHOOK")
      return errorResponse("Missing payment ID", 400)
    }

    // Fetch payment details from Mercado Pago
    const payment = await getPaymentDetails(paymentId)

    if (!payment) {
      logger.error("Failed to fetch payment details", "MP_WEBHOOK", { paymentId })
      return successResponse({ received: true })
    }

    const success = await processPayment(payment)

    if (success) {
      logger.info("Payment processed successfully", "MP_WEBHOOK", { paymentId, status: payment.status })
    } else {
      logger.error("Failed to process payment", "MP_WEBHOOK", { paymentId, status: payment.status })
    }

    return successResponse({ received: true })
  } catch (error) {
    logger.error("Error processing webhook", "MP_WEBHOOK", error)
    // Always return 200 to avoid retries
    return successResponse({ received: true })
  }
}

export async function GET() {
  const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`
    : "Not configured"

  return NextResponse.json({
    status: "webhook_endpoint_active",
    webhook_url: webhookUrl,
    mercado_pago_connected: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
    test_mode: process.env.MERCADO_PAGO_TEST_MODE === "true",
  })
}
