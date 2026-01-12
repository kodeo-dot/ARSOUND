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

  const finalAmount = discount ? amount - discount : amount

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compra exitosa - ARSOUND</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <!-- Main Card -->
        <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
          
          <!-- Hero Header -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 48px 40px; text-align: center;">
                    <!-- Logo/Brand -->
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: inline-block; padding: 12px 24px; border-radius: 12px; margin-bottom: 24px;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
                    </div>
                    <!-- Success Icon -->
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.95); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                    <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">¡Compra Exitosa!</h2>
                    <p style="margin: 0; font-size: 17px; color: rgba(255,255,255,0.9);">Tu pack está listo para descargar</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <!-- Greeting -->
              <h3 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1a1a1a;">Hola ${buyerName} 👋</h3>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #4a5568;">
                Gracias por tu compra. Tu pack ya está disponible y podés descargarlo las veces que necesites usando tu código único.
              </p>
              
              <!-- Pack Card with Visual Enhancement -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; margin-bottom: 32px; border: 2px solid #e2e8f0; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <!-- Colored Top Bar -->
                    <div style="height: 6px; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);"></div>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 28px;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #667eea; text-transform: uppercase; letter-spacing: 1px;">📦 Pack Adquirido</p>
                          <h4 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #1a1a1a; line-height: 1.4;">${packTitle}</h4>
                          <p style="margin: 0; font-size: 15px; color: #718096;">
                            <span style="color: #a0aec0;">Creado por</span> <strong style="color: #2d3748;">${sellerName}</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Download Code - Enhanced -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; margin-bottom: 32px; box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.9); text-transform: uppercase; letter-spacing: 1px;">Tu Código de Descarga</p>
                    <div style="background: rgba(255,255,255,0.95); padding: 16px 24px; border-radius: 12px; display: inline-block; margin: 0 auto;">
                      <p style="margin: 0; font-size: 24px; font-weight: 800; color: #667eea; font-family: 'Courier New', monospace; letter-spacing: 2px;">${purchaseCode}</p>
                    </div>
                    <p style="margin: 16px 0 0; font-size: 13px; color: rgba(255,255,255,0.85);">Guardá este código para futuras descargas</p>
                  </td>
                </tr>
              </table>
              
              <!-- Purchase Details Grid -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px; background: #fafbfc; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; font-size: 13px; font-weight: 700; color: #667eea; text-transform: uppercase; letter-spacing: 0.5px;">📋 Detalles de la Compra</p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      ${
                        transactionId
                          ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">ID de Transacción</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748; font-family: monospace;">${transactionId}</p>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Fecha y Hora</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748;">${purchaseDate}</p>
                        </td>
                      </tr>
                      
                      ${
                        discount
                          ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Precio Original</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; color: #a0aec0; text-decoration: line-through;">$${amount.toFixed(2)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #48bb78; font-weight: 600;">🎉 Descuento Aplicado</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #48bb78;">-$${discount.toFixed(2)}</p>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      
                      <tr>
                        <td style="padding: 14px 0 0;">
                          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">Total Pagado</p>
                        </td>
                        <td style="padding: 14px 0 0; text-align: right;">
                          <p style="margin: 0; font-size: 26px; font-weight: 800; color: #667eea;">$${finalAmount.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button - Enhanced -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                <tr>
                  <td align="center" style="padding: 12px 0;">
                    <a href="${downloadUrl}" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-size: 17px; font-weight: 700; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                      ⬇️ Descargar Mi Pack Ahora
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Cards -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background: #f0fff4; border-left: 4px solid #48bb78; border-radius: 8px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #22543d;">💡 Tip Importante</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #2f855a;">
                      Podés descargar este pack las veces que quieras usando tu código. Te recomendamos guardar este email para futuras referencias.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #2d3748;">¿Necesitás ayuda? 🤝</p>
                    <p style="margin: 0; font-size: 14px; color: #718096;">
                      Estamos para ayudarte en <a href="mailto:soporte@arsound.com.ar" style="color: #667eea; text-decoration: none; font-weight: 600;">soporte@arsound.com.ar</a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: #f7fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1a1a1a;">ARSOUND</p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #718096;">El marketplace de samples #1 de Argentina 🇦🇷</p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.
              </p>
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

  const commissionPercent = ((commission / amount) * 100).toFixed(1)

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva venta - ARSOUND</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
          
          <!-- Hero Header -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 48px 40px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: inline-block; padding: 12px 24px; border-radius: 12px; margin-bottom: 24px;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
                    </div>
                    <!-- Money Icon -->
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.95); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                      <span style="font-size: 40px;">💰</span>
                    </div>
                    <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">¡Nueva Venta!</h2>
                    <p style="margin: 0; font-size: 17px; color: rgba(255,255,255,0.9);">Acabás de recibir un pago</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <h3 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1a1a1a;">¡Felicitaciones ${sellerName}! 🎉</h3>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #4a5568;">
                <strong style="color: #2d3748;">${buyerName}</strong> compró tu pack. Las ganancias serán transferidas a tu cuenta de Mercado Pago en las próximas 24-48 horas.
              </p>
              
              <!-- Earnings Highlight - Big Visual Impact -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 20px; margin-bottom: 32px; border: 3px solid #10b981; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);">
                <tr>
                  <td style="padding: 36px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1px;">💸 Tus Ganancias</p>
                    <p style="margin: 0; font-size: 48px; font-weight: 900; color: #047857; line-height: 1;">$${earnings.toFixed(2)}</p>
                    <p style="margin: 12px 0 0; font-size: 13px; color: #059669; font-weight: 600;">Transferencia en proceso a Mercado Pago</p>
                  </td>
                </tr>
              </table>
              
              <!-- Pack Info -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border-radius: 16px; margin-bottom: 28px; border: 2px solid #e2e8f0; overflow: hidden;">
                <tr>
                  <td style="padding: 0;">
                    <div style="height: 6px; background: linear-gradient(90deg, #10b981 0%, #059669 100%);"></div>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 24px;">
                          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 1px;">📦 Pack Vendido</p>
                          <h4 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a1a; line-height: 1.4;">${packTitle}</h4>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Sale Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 28px; background: #fafbfc; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; font-size: 13px; font-weight: 700; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">📊 Detalles de la Venta</p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Comprador</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2d3748;">${buyerName}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Código de Compra</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748; font-family: 'Courier New', monospace;">${purchaseCode}</p>
                        </td>
                      </tr>
                      
                      ${
                        transactionId
                          ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">ID de Transacción</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 13px; font-weight: 500; color: #2d3748; font-family: monospace;">${transactionId}</p>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Fecha y Hora</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748;">${purchaseDate}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Precio de Venta</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 15px; font-weight: 700; color: #2d3748;">$${amount.toFixed(2)}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 2px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #e53e3e;">Comisión ARSOUND (${commissionPercent}%)</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 2px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 15px; font-weight: 600; color: #e53e3e;">-$${commission.toFixed(2)}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 14px 0 0;">
                          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">Tus Ganancias Netas</p>
                        </td>
                        <td style="padding: 14px 0 0; text-align: right;">
                          <p style="margin: 0; font-size: 28px; font-weight: 900; color: #10b981;">$${earnings.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Transfer Info -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #92400e;">⏰ Tiempo de Transferencia</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #b45309;">
                      Las ganancias se transfieren automáticamente a tu cuenta de Mercado Pago dentro de las próximas <strong>24-48 horas hábiles</strong>.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Stats Tip -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #1e40af;">📈 Consejo</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e40af;">
                      Revisá tus estadísticas completas en tu <strong>dashboard</strong> para ver todas tus ventas y ganancias totales.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #2d3748;">¿Tenés alguna consulta? 🤝</p>
                    <p style="margin: 0; font-size: 14px; color: #718096;">
                      Contactanos en <a href="mailto:soporte@arsound.com.ar" style="color: #10b981; text-decoration: none; font-weight: 600;">soporte@arsound.com.ar</a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: #f7fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1a1a1a;">ARSOUND</p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #718096;">El marketplace de samples #1 de Argentina 🇦🇷</p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.
              </p>
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 48px 20px;">
        <table role="presentation" style="width: 100%; max-width: 650px; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
          
          <!-- Hero Header -->
          <tr>
            <td style="padding: 0; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 48px 40px; text-align: center;">
                    <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: inline-block; padding: 12px 24px; border-radius: 12px; margin-bottom: 24px;">
                      <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ARSOUND</h1>
                    </div>
                    <!-- Rocket Icon -->
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.95); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px rgba(0,0,0,0.15);">
                      <span style="font-size: 40px;">🚀</span>
                    </div>
                    <h2 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff;">¡Bienvenido al Plan ${planName}!</h2>
                    <p style="margin: 0; font-size: 17px; color: rgba(255,255,255,0.9);">Tu cuenta ha sido mejorada</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              
              <h3 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #1a1a1a;">¡Hola ${userName}! 👋</h3>
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.7; color: #4a5568;">
                Tu suscripción al plan <strong style="color: #f59e0b;">${planName}</strong> está activa. Ahora tenés acceso a beneficios exclusivos para llevar tu música al siguiente nivel.
              </p>
              
              <!-- Plan Badge -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 32px; border: 3px solid #f59e0b; overflow: hidden; box-shadow: 0 6px 20px rgba(245, 158, 11, 0.25);">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">✨ Tu Plan Activo</p>
                    <p style="margin: 0; font-size: 36px; font-weight: 900; color: #b45309; line-height: 1;">${planName}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Features List -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #fafbfc; border-radius: 12px; margin-bottom: 28px; padding: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 20px; font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">🎁 Tus Beneficios Incluyen:</p>
                    ${features
                      .map(
                        (feature) => `
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
                      <tr>
                        <td style="width: 32px; vertical-align: top;">
                          <div style="width: 24px; height: 24px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="color: white; font-size: 14px; font-weight: bold;">✓</span>
                          </div>
                        </td>
                        <td style="vertical-align: top; padding-left: 12px;">
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #2d3748; font-weight: 500;">${feature}</p>
                        </td>
                      </tr>
                    </table>
                    `,
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
              
              <!-- Purchase Details -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 28px; background: #f7fafc; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; font-size: 13px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">📋 Detalles de la Suscripción</p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Plan Seleccionado</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2d3748;">${planName}</p>
                        </td>
                      </tr>
                      
                      ${
                        transactionId
                          ? `
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">ID de Transacción</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 13px; font-weight: 500; color: #2d3748; font-family: monospace;">${transactionId}</p>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                      
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                          <p style="margin: 0; font-size: 14px; color: #718096;">Fecha de Activación</p>
                        </td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2d3748;">${purchaseDate}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 14px 0 0;">
                          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1a1a1a;">Monto Pagado</p>
                        </td>
                        <td style="padding: 14px 0 0; text-align: right;">
                          <p style="margin: 0; font-size: 26px; font-weight: 800; color: #f59e0b;">$${amount.toFixed(2)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                    <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #065f46;">💡 Aprovechá al Máximo</p>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #047857;">
                      Tu plan estará activo durante todo el período de suscripción. Podés gestionar tu cuenta y ver tus límites desde tu perfil.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Help Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: #2d3748;">¿Necesitás ayuda con tu plan? 🤝</p>
                    <p style="margin: 0; font-size: 14px; color: #718096;">
                      Estamos para ayudarte en <a href="mailto:soporte@arsound.com.ar" style="color: #f59e0b; text-decoration: none; font-weight: 600;">soporte@arsound.com.ar</a>
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: #f7fafc; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #1a1a1a;">ARSOUND</p>
              <p style="margin: 0 0 12px; font-size: 13px; color: #718096;">El marketplace de samples #1 de Argentina 🇦🇷</p>
              <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} ARSOUND. Todos los derechos reservados.
              </p>
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
