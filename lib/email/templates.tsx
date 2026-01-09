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
  <meta charset="UTF-8">
  <title>Compra realizada - ARSOUND</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">¡Gracias por tu compra!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola <strong>${data.buyerName}</strong>,</p>
    
    <p>Tu compra de <strong>${data.packTitle}</strong> se ha completado exitosamente.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Total pagado</p>
      <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #667eea;">$${data.amount.toLocaleString("es-AR")} ARS</p>
      <p style="margin: 10px 0 0; font-size: 12px; color: #999;">Código de compra: ${data.purchaseCode}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.downloadUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Descargar Pack
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">Si tenés alguna pregunta, no dudes en contactarnos.</p>
    
    <p style="font-size: 14px; margin-top: 30px;">
      Saludos,<br>
      <strong>El equipo de ARSOUND</strong>
    </p>
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
  <meta charset="UTF-8">
  <title>Nueva venta - ARSOUND</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">¡Nueva Venta!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola <strong>${data.sellerName}</strong>,</p>
    
    <p><strong>${data.buyerName}</strong> compró tu pack <strong>${data.packTitle}</strong>.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Tus ganancias</p>
      <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #11998e;">$${data.earnings.toLocaleString("es-AR")} ARS</p>
      <p style="margin: 10px 0 0; font-size: 12px; color: #999;">Comisión de plataforma: $${data.commission.toLocaleString("es-AR")} ARS</p>
    </div>
    
    <p style="font-size: 14px; color: #666;">¡Seguí creando contenido increíble!</p>
    
    <p style="font-size: 14px; margin-top: 30px;">
      Saludos,<br>
      <strong>El equipo de ARSOUND</strong>
    </p>
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
  <meta charset="UTF-8">
  <title>Bienvenido a ${data.planName} - ARSOUND</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">¡Bienvenido a ${data.planName}!</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hola <strong>${data.userName}</strong>,</p>
    
    <p>Tu suscripción al plan <strong>${data.planName}</strong> está activa.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;">Inversión mensual</p>
      <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #f5576c;">$${data.amount.toLocaleString("es-AR")} ARS</p>
      <p style="margin: 10px 0 0; font-size: 12px; color: #999;">Válido hasta: ${new Date(data.expiresAt).toLocaleDateString("es-AR")}</p>
    </div>
    
    <p style="font-size: 14px; color: #666;">Ahora tenés acceso a todas las funcionalidades premium de tu plan.</p>
    
    <p style="font-size: 14px; margin-top: 30px;">
      Saludos,<br>
      <strong>El equipo de ARSOUND</strong>
    </p>
  </div>
</body>
</html>
  `
}
