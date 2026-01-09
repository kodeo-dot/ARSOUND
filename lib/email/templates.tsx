export function getPackPurchaseEmailHTML(data: {
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
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra Exitosa - ARSOUND</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .pack-info { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .pack-title { font-size: 20px; font-weight: bold; color: #1a202c; margin: 0 0 10px 0; }
    .purchase-code { background-color: #e2e8f0; border-radius: 4px; padding: 12px; margin: 20px 0; font-family: 'Courier New', monospace; font-size: 16px; text-align: center; letter-spacing: 2px; }
    .download-btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 ¡Compra Exitosa!</h1>
    </div>
    <div class="content">
      <p>Hola ${data.buyerName},</p>
      <p>Tu compra se ha procesado exitosamente. Gracias por confiar en ARSOUND.</p>
      
      <div class="pack-info">
        <p class="pack-title">${data.packTitle}</p>
        <p><strong>Precio pagado:</strong> $${data.amount.toLocaleString("es-AR")}</p>
      </div>

      <p><strong>Código de compra:</strong></p>
      <div class="purchase-code">${data.purchaseCode}</div>

      <p>Puedes descargar tu pack haciendo clic en el botón de abajo:</p>
      
      <center>
        <a href="${data.downloadUrl}" class="download-btn">Descargar Pack</a>
      </center>

      <p style="margin-top: 30px; color: #718096; font-size: 14px;">
        Este link estará disponible en tu perfil en cualquier momento.
      </p>
    </div>
    <div class="footer">
      <p>ARSOUND - La plataforma de venta de packs de producción musical</p>
      <p>© ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getPlanUpgradeEmailHTML(data: {
  userName: string
  planName: string
  planFeatures: string[]
}): string {
  const featuresHTML = data.planFeatures.map((feature) => `<li>${feature}</li>`).join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan Actualizado - ARSOUND</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .plan-badge { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: #ffffff; padding: 8px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
    .features { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .features ul { margin: 10px 0; padding-left: 20px; }
    .features li { margin: 8px 0; color: #2d3748; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 ¡Plan Actualizado!</h1>
    </div>
    <div class="content">
      <p>Hola ${data.userName},</p>
      <p>Tu plan ha sido actualizado exitosamente.</p>
      
      <center>
        <span class="plan-badge">${data.planName}</span>
      </center>

      <div class="features">
        <p><strong>Características de tu nuevo plan:</strong></p>
        <ul>
          ${featuresHTML}
        </ul>
      </div>

      <p>Ahora puedes aprovechar todas las ventajas de tu plan mejorado.</p>
      
      <center>
        <a href="https://arsound.vercel.app/upload" class="cta-btn">Subir Pack</a>
      </center>
    </div>
    <div class="footer">
      <p>ARSOUND - La plataforma de venta de packs de producción musical</p>
      <p>© ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getPackPurchaseEmailText(data: {
  buyerName: string
  packTitle: string
  amount: number
  purchaseCode: string
  downloadUrl: string
}): string {
  return `
¡Compra Exitosa!

Hola ${data.buyerName},

Tu compra se ha procesado exitosamente. Gracias por confiar en ARSOUND.

Pack comprado: ${data.packTitle}
Precio pagado: $${data.amount.toLocaleString("es-AR")}

Código de compra: ${data.purchaseCode}

Descarga tu pack aquí: ${data.downloadUrl}

Este link estará disponible en tu perfil en cualquier momento.

---
ARSOUND - La plataforma de venta de packs de producción musical
© ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.
  `
}

export function getPlanUpgradeEmailText(data: {
  userName: string
  planName: string
  planFeatures: string[]
}): string {
  const featuresText = data.planFeatures.map((feature) => `- ${feature}`).join("\n")

  return `
¡Plan Actualizado!

Hola ${data.userName},

Tu plan ha sido actualizado exitosamente a: ${data.planName}

Características de tu nuevo plan:
${featuresText}

Ahora puedes aprovechar todas las ventajas de tu plan mejorado.

Sube tu primer pack: https://arsound.vercel.app/upload

---
ARSOUND - La plataforma de venta de packs de producción musical
© ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.
  `
}
