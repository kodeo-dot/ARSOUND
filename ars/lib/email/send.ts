import nodemailer from "nodemailer"

export async function sendEmailBrevo({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER!,
      pass: process.env.BREVO_API_KEY!,
    },
  })

  await transporter.sendMail({
    from: '"ARSOUND" <soporte@arsound.com.ar>',
    to,
    subject,
    html,
  })
}
