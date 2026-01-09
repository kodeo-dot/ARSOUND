import { logger } from "../utils/logger"

export interface EmailOptions {
  to: string[]
  subject: string
  htmlContent: string
  sender?: {
    email: string
    name: string
  }
}

export async function sendEmail(
  options: EmailOptions,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      logger.error("Brevo API key not configured", "EMAIL")
      return { success: false, error: "Email service not configured" }
    }

    const sender = options.sender || {
      email: process.env.BREVO_SENDER_EMAIL || "noreply@arsound.com.ar",
      name: "ARSOUND",
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: options.to.map((email) => ({ email })),
        sender,
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      logger.error("Brevo API error", "EMAIL", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    const data = await response.json()
    logger.info("Email sent successfully", "EMAIL", { messageId: data.messageId })
    return { success: true, messageId: data.messageId }
  } catch (error) {
    logger.error("Error sending email", "EMAIL", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
