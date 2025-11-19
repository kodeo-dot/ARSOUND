export function generatePackPurchaseEmailBuyer(params: {
  buyerName: string
  packTitle: string
  sellerName: string
  amount: number
  discount?: number
  purchaseCode: string
  downloadUrl: string
}) {
  const discountText = params.discount ? `<p><strong>Descuento aplicado:</strong> $${params.discount}</p>` : ""

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { margin: 20px 0; }
          .purchase-details { background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Gracias por tu compra, ${params.buyerName}!</h1>
          </div>
          
          <div class="content">
            <p>Acabas de comprar <strong>${params.packTitle}</strong> de ${params.sellerName}.</p>
            
            <div class="purchase-details">
              <h3>Detalles de la compra:</h3>
              <p><strong>Pack:</strong> ${params.packTitle}</p>
              <p><strong>Creador:</strong> ${params.sellerName}</p>
              <p><strong>Monto pagado:</strong> $${params.amount}</p>
              ${discountText}
              <p><strong>Código de compra:</strong> ${params.purchaseCode}</p>
            </div>
            
            <p>Tu pack está listo para descargar:</p>
            <a href="${params.downloadUrl}" class="button">Descargar Pack</a>
            
            <p>Si tienes problemas para descargar, contacta con nuestro soporte.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no responder a este mensaje.</p>
            <p>&copy; 2025 ArSound. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function generatePackSaleEmailSeller(params: {
  sellerName: string
  buyerName: string
  packTitle: string
  amount: number
  commission: number
  earnings: number
  purchaseCode: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { margin: 20px 0; }
          .earnings { background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .breakdown { background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Nueva venta de tu pack!</h1>
          </div>
          
          <div class="content">
            <p>Hola ${params.sellerName},</p>
            <p>${params.buyerName} acaba de comprar tu pack <strong>${params.packTitle}</strong>.</p>
            
            <div class="earnings">
              <h3>💰 Tus ganancias:</h3>
              <p style="font-size: 24px; margin: 10px 0;"><strong>$${params.earnings}</strong></p>
            </div>
            
            <div class="breakdown">
              <h4>Desglose de la transacción:</h4>
              <p><strong>Monto de venta:</strong> $${params.amount}</p>
              <p><strong>Comisión de plataforma:</strong> $${params.commission}</p>
              <p><strong>Ganancia neta:</strong> <strong>$${params.earnings}</strong></p>
              <p><strong>Código de compra:</strong> ${params.purchaseCode}</p>
            </div>
            
            <p>Las ganancias se reflejarán en tu cuenta según tu método de pago configurado.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no responder a este mensaje.</p>
            <p>&copy; 2025 ArSound. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function generatePlanPurchaseEmail(params: {
  userName: string
  planName: string
  amount: number
  features: string[]
  purchaseDate: string
}) {
  const featuresList = params.features.map((f) => `<li>${f}</li>`).join("")

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .content { margin: 20px 0; }
          .plan-details { background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .features { background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
          ul { list-style-position: inside; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido al plan ${params.planName}!</h1>
          </div>
          
          <div class="content">
            <p>Hola ${params.userName},</p>
            <p>Tu suscripción al plan <strong>${params.planName}</strong> ha sido confirmada.</p>
            
            <div class="plan-details">
              <h3>Detalles de tu suscripción:</h3>
              <p><strong>Plan:</strong> ${params.planName}</p>
              <p><strong>Monto pagado:</strong> $${params.amount}</p>
              <p><strong>Fecha de compra:</strong> ${params.purchaseDate}</p>
            </div>
            
            <div class="features">
              <h3>Beneficios incluidos:</h3>
              <ul>
                ${featuresList}
              </ul>
            </div>
            
            <p>Ahora puedes aprovechar todos los beneficios de tu plan. Accede a tu cuenta para comenzar.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no responder a este mensaje.</p>
            <p>&copy; 2025 ArSound. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
