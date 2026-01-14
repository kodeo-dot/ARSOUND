export function getPackPurchaseEmailBuyer(data: {
  buyerName: string
  packTitle: string
  amount: number
  purchaseCode: string
  downloadUrl: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .code { background: #f5f5f5; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Gracias por tu compra! 🎵</h1>
          </div>
          <div class="content">
            <p>Hola ${data.buyerName},</p>
            <p>Confirmamos tu compra de <strong>${data.packTitle}</strong> por $${data.amount}.</p>
            <p>Tu código de descarga:</p>
            <div class="code">${data.purchaseCode}</div>
            <p>Ya podés descargar tu pack:</p>
            <a href="${data.downloadUrl}" class="button">Descargar Pack</a>
            <p>Gracias por confiar en ARSOUND. ¡Disfrutá creando música!</p>
          </div>
          <div class="footer">
            <p>ARSOUND - La plataforma para productores musicales</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPackPurchaseEmailSeller(data: {
  sellerName: string
  buyerName: string
  packTitle: string
  earnings: number
  commission: number
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .earnings { background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .amount { font-size: 32px; font-weight: bold; color: #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Vendiste un pack! 💰</h1>
          </div>
          <div class="content">
            <p>Hola ${data.sellerName},</p>
            <p><strong>${data.buyerName}</strong> compró tu pack <strong>${data.packTitle}</strong>.</p>
            <div class="earnings">
              <p style="margin: 0 0 10px 0; color: #666;">Ganaste:</p>
              <div class="amount">$${data.earnings}</div>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Comisión de plataforma: $${data.commission}</p>
            </div>
            <p>¡Seguí creando y vendiendo en ARSOUND!</p>
          </div>
          <div class="footer">
            <p>ARSOUND - La plataforma para productores musicales</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getPlanPurchaseEmail(data: {
  userName: string
  planName: string
  amount: number
  expiresAt: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .plan-info { background: #fffbeb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a ${data.planName}! 🚀</h1>
          </div>
          <div class="content">
            <p>Hola ${data.userName},</p>
            <p>Tu suscripción al plan <strong>${data.planName}</strong> está activa.</p>
            <div class="plan-info">
              <p><strong>Plan:</strong> ${data.planName}</p>
              <p><strong>Monto:</strong> $${data.amount}</p>
              <p><strong>Vence:</strong> ${data.expiresAt}</p>
            </div>
            <p>Ahora podés disfrutar de todos los beneficios de tu plan. ¡Empezá a crear!</p>
          </div>
          <div class="footer">
            <p>ARSOUND - La plataforma para productores musicales</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function getLimitReachedEmail(data: {
  userName: string
  limitType: "download" | "upload"
  limitMessage: string
  planName: string
  upgradeUrl: string
}): string {
  const isDownload = data.limitType === "download"
  const emoji = isDownload ? "📥" : "📤"
  const title = isDownload ? "Límite de Descargas Alcanzado" : "Límite de Uploads Alcanzado"

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .warning { background: #fef2f2; padding: 20px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${emoji} ${title}</h1>
          </div>
          <div class="content">
            <p>Hola ${data.userName},</p>
            <div class="warning">
              <p style="margin: 0; font-weight: bold;">⚠️ Límite Alcanzado</p>
              <p style="margin: 10px 0 0 0;">${data.limitMessage}</p>
            </div>
            <p>Tu plan actual es: <strong>${data.planName}</strong></p>
            <p>Para seguir ${isDownload ? "descargando" : "subiendo"} packs, podés mejorar tu plan y obtener más beneficios:</p>
            <ul>
              <li>${isDownload ? "Más descargas mensuales" : "Más uploads mensuales"}</li>
              <li>Estadísticas avanzadas</li>
              <li>Soporte prioritario</li>
              <li>Y mucho más...</li>
            </ul>
            <a href="${data.upgradeUrl}" class="button">Ver Planes</a>
          </div>
          <div class="footer">
            <p>ARSOUND - La plataforma para productores musicales</p>
          </div>
        </div>
      </body>
    </html>
  `
}
