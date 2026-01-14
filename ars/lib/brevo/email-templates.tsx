interface PackPurchaseEmailBuyerParams {
  buyerName: string
  packTitle: string
  sellerName: string
  amount: number
  discount?: number
  purchaseCode: string
  downloadUrl: string
  transactionId?: string
  purchaseDate?: string
}

interface PackSaleEmailSellerParams {
  sellerName: string
  buyerName: string
  packTitle: string
  amount: number
  commission: number
  earnings: number
  purchaseCode: string
  transactionId?: string
  purchaseDate?: string
}

interface PlanPurchaseEmailParams {
  userName: string
  planName: string
  amount: number
  features: string[]
  purchaseDate: string
  transactionId?: string
}

export function generatePackPurchaseEmailBuyer(params: PackPurchaseEmailBuyerParams): string {
  const {
    buyerName,
    packTitle,
    sellerName,
    amount,
    discount,
    purchaseCode,
    downloadUrl,
    transactionId,
    purchaseDate = new Date().toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  } = params

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra exitosa - ARSOUND</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.95);">Tu compra está lista</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1d1d1f;">¡Hola, ${buyerName}!</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424245;">
                Tu compra se ha procesado exitosamente. Ya podés descargar tu pack.
              </p>
              
              <!-- Pack Info Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9fb; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.5px;">Pack Adquirido</p>
                    <p style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1d1d1f;">${packTitle}</p>
                    <p style="margin: 0; font-size: 14px; color: #424245;">Creado por <strong>${sellerName}</strong></p>
                  </td>
                </tr>
              </table>
              
              <!-- Purchase Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Código de compra</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f; font-family: 'Courier New', monospace;">${purchaseCode}</p>
                  </td>
                </tr>
                ${
                  transactionId
                    ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">ID de transacción</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${transactionId}</p>
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Fecha y hora</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${purchaseDate}</p>
                  </td>
                </tr>
                ${
                  discount
                    ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Descuento aplicado</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #10b981;">-$${discount.toFixed(2)}</p>
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Total pagado</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #1d1d1f;">$${amount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Descargar Pack
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9fb; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #424245;">¿Necesitás ayuda?</p>
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Contactanos en <a href="mailto:soporte@arsound.com.ar" style="color: #667eea; text-decoration: none; font-weight: 500;">soporte@arsound.com.ar</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1d1d1f;">ARSOUND</p>
              <p style="margin: 0; font-size: 13px; color: #86868b;">El marketplace de samples de Argentina</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generatePackSaleEmailSeller(params: PackSaleEmailSellerParams): string {
  const {
    sellerName,
    buyerName,
    packTitle,
    amount,
    commission,
    earnings,
    purchaseCode,
    transactionId,
    purchaseDate = new Date().toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  } = params

  const commissionPercent = ((commission / amount) * 100).toFixed(0)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva venta - ARSOUND</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.95);">¡Tenés una nueva venta!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1d1d1f;">¡Felicitaciones, ${sellerName}!</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424245;">
                <strong>${buyerName}</strong> compró tu pack. Las ganancias serán transferidas a tu cuenta de Mercado Pago.
              </p>
              
              <!-- Pack Info Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Pack Vendido</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1d1d1f;">${packTitle}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Sale Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Comprador</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f;">${buyerName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Código de compra</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f; font-family: 'Courier New', monospace;">${purchaseCode}</p>
                  </td>
                </tr>
                ${
                  transactionId
                    ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">ID de transacción</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${transactionId}</p>
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Fecha y hora</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${purchaseDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Precio de venta</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">$${amount.toFixed(2)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Comisión ARSOUND (${commissionPercent}%)</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #dc2626;">-$${commission.toFixed(2)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Tus ganancias</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #10b981;">$${earnings.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9fb; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1d1d1f;">💰 Transferencia de ganancias</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #424245;">
                      Tus ganancias serán transferidas automáticamente a tu cuenta de Mercado Pago vinculada dentro de las próximas 24-48 horas.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9fb; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #424245;">¿Tenés alguna consulta?</p>
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Contactanos en <a href="mailto:soporte@arsound.com.ar" style="color: #667eea; text-decoration: none; font-weight: 500;">soporte@arsound.com.ar</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1d1d1f;">ARSOUND</p>
              <p style="margin: 0; font-size: 13px; color: #86868b;">El marketplace de samples de Argentina</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export function generatePlanPurchaseEmail(params: PlanPurchaseEmailParams): string {
  const { userName, planName, amount, features, purchaseDate, transactionId } = params

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suscripción activa - ARSOUND</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f7;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
              <p style="margin: 12px 0 0; font-size: 16px; color: rgba(255,255,255,0.95);">Bienvenido al plan ${planName}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1d1d1f;">¡Hola, ${userName}!</h2>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #424245;">
                Tu suscripción al plan <strong>${planName}</strong> está activa. Ahora podés disfrutar de todos los beneficios.
              </p>
              
              <!-- Plan Features -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef3c7; border-radius: 12px; margin-bottom: 24px; border: 1px solid #fde047;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Beneficios del Plan ${planName}</p>
                    ${features
                      .map(
                        (feature) => `
                    <p style="margin: 0 0 8px; font-size: 15px; color: #1d1d1f; display: flex; align-items: center;">
                      <span style="color: #10b981; margin-right: 8px;">✓</span> ${feature}
                    </p>
                    `,
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
              
              <!-- Purchase Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Plan</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #1d1d1f;">${planName}</p>
                  </td>
                </tr>
                ${
                  transactionId
                    ? `<tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">ID de transacción</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${transactionId}</p>
                  </td>
                </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e7;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Fecha de activación</p>
                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 500; color: #1d1d1f;">${purchaseDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Monto</p>
                    <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #1d1d1f;">$${amount.toFixed(2)}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9f9fb; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #424245;">¿Necesitás ayuda con tu plan?</p>
                    <p style="margin: 0; font-size: 14px; color: #86868b;">Contactanos en <a href="mailto:soporte@arsound.com.ar" style="color: #667eea; text-decoration: none; font-weight: 500;">soporte@arsound.com.ar</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e7;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1d1d1f;">ARSOUND</p>
              <p style="margin: 0; font-size: 13px; color: #86868b;">El marketplace de samples de Argentina</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}
