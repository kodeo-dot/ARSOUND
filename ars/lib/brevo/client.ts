interface BrevoEmailOptions {
  to: string[]
  subject: string
  htmlContent: string
  sender: {
    email: string
    name: string
  }
}

export async function sendBrevoEmail(options: BrevoEmailOptions) {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.error("[v0] Brevo API key not configured")
      return { success: false, error: "Brevo API key not configured" }
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: options.to.map((email) => ({ email })),
        sender: options.sender,
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Brevo API error:", error)
      return { success: false, error: error.message || "Failed to send email" }
    }

    const data = await response.json()
    console.log("[v0] Email sent successfully via Brevo:", data.messageId)
    return { success: true, messageId: data.messageId }
  } catch (error) {
    console.error("[v0] Error sending email via Brevo:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
