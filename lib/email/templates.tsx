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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .wrapper {
      padding: 40px 20px;
      min-height: 100vh;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 48px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      color: #475569;
      line-height: 1.7;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .content strong {
      color: #0f172a;
      font-weight: 600;
    }
    .highlight {
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-radius: 12px;
      padding: 24px;
      margin: 28px 0;
      border-left: 4px solid #6366f1;
    }
    .code {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin: 28px 0;
      letter-spacing: 2px;
      color: #0f172a;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 20px;
      box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);
      transition: all 0.2s;
    }
    .footer {
      padding: 32px;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }
    .footer-logo {
      font-size: 18px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Compra Confirmada</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.buyerName}</strong>,</p>
        <p>Tu compra se ha procesado exitosamente. Ya podés acceder a tu contenido.</p>
        
        <div class="highlight">
          <p style="margin: 0;"><strong>Pack:</strong> ${data.packTitle}</p>
          <p style="margin: 8px 0 0 0;"><strong>Monto:</strong> $${data.amount.toLocaleString("es-AR")}</p>
        </div>

        <p style="margin-top: 32px; margin-bottom: 12px; font-weight: 600; color: #0f172a;">Tu código de descarga:</p>
        <div class="code">${data.purchaseCode}</div>

        <div style="text-align: center;">
          <a href="${data.downloadUrl}" class="button">Descargar Pack</a>
        </div>

        <p style="margin-top: 32px; font-size: 14px; color: #64748b;">
          Guardá este código para futuras descargas. También lo podés encontrar en tu perfil.
        </p>
      </div>
      <div class="footer">
        <div class="footer-logo">ARSOUND</div>
        <div>Plataforma para productores musicales</div>
      </div>
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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wrapper {
      padding: 40px 20px;
      min-height: 100vh;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      color: #475569;
      line-height: 1.7;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .earnings-box {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin: 28px 0;
      border: 2px solid #10b981;
    }
    .amount {
      font-size: 48px;
      font-weight: 800;
      color: #047857;
      margin: 12px 0;
      letter-spacing: -1px;
    }
    .meta {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      margin-top: 16px;
      border: 1px solid #e2e8f0;
    }
    .meta-item {
      text-align: center;
      flex: 1;
    }
    .meta-label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .meta-value {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Nueva Venta</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.sellerName}</strong>,</p>
        <p><strong>${data.buyerName}</strong> compró tu pack <strong>${data.packTitle}</strong>.</p>

        <div class="earnings-box">
          <div style="font-size: 14px; color: #047857; font-weight: 600; margin-bottom: 8px;">TUS GANANCIAS</div>
          <div class="amount">$${data.earnings.toLocaleString("es-AR")}</div>
          
          <div class="meta">
            <div class="meta-item">
              <div class="meta-label">Comisión</div>
              <div class="meta-value">$${data.commission.toLocaleString("es-AR")}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Total</div>
              <div class="meta-value">$${(data.earnings + data.commission).toLocaleString("es-AR")}</div>
            </div>
          </div>
        </div>

        <p style="font-size: 14px; color: #64748b; margin-top: 28px;">
          Seguí creando contenido increíble. Tus ganancias se reflejarán en tu perfil.
        </p>
      </div>
      <div class="footer">
        <div style="font-size: 18px; font-weight: 700; color: #10b981; margin-bottom: 8px;">ARSOUND</div>
        <div>Plataforma para productores musicales</div>
      </div>
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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wrapper {
      padding: 40px 20px;
      min-height: 100vh;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      color: #475569;
      line-height: 1.7;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .plan-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 16px;
      padding: 32px;
      margin: 28px 0;
      border: 2px solid #f59e0b;
    }
    .plan-name {
      font-size: 28px;
      font-weight: 800;
      color: #b45309;
      text-align: center;
      margin-bottom: 24px;
      letter-spacing: -0.5px;
    }
    .info-grid {
      display: grid;
      gap: 16px;
    }
    .info-item {
      background: white;
      padding: 16px 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #fbbf24;
    }
    .info-label {
      font-size: 14px;
      color: #78350f;
      font-weight: 600;
    }
    .info-value {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    .features {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin-top: 28px;
      border: 1px solid #e2e8f0;
    }
    .features-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      color: #475569;
      font-size: 14px;
    }
    .checkmark {
      width: 20px;
      height: 20px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      flex-shrink: 0;
    }
    .footer {
      padding: 32px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>Plan Activado</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.userName}</strong>,</p>
        <p>Tu plan ha sido activado exitosamente. Ya podés disfrutar de todos los beneficios.</p>
        
        <div class="plan-box">
          <div class="plan-name">${data.planName}</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Monto pagado</span>
              <span class="info-value">$${data.amount.toLocaleString("es-AR")}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Vence</span>
              <span class="info-value">${data.expiresAt}</span>
            </div>
          </div>
        </div>

        <div class="features">
          <div class="features-title">Beneficios activados</div>
          <div class="feature-item">
            <span class="checkmark">✓</span>
            <span>Acceso completo a todas las funciones del plan</span>
          </div>
          <div class="feature-item">
            <span class="checkmark">✓</span>
            <span>Renovación automática cada 30 días</span>
          </div>
          <div class="feature-item">
            <span class="checkmark">✓</span>
            <span>Soporte prioritario</span>
          </div>
        </div>

        <p style="margin-top: 28px; font-size: 14px; color: #64748b;">
          Recordá que tu plan se renovará automáticamente. Podés cancelar cuando quieras desde tu perfil.
        </p>
      </div>
      <div class="footer">
        <div style="font-size: 18px; font-weight: 700; color: #f59e0b; margin-bottom: 8px;">ARSOUND</div>
        <div>Plataforma para productores musicales</div>
      </div>
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
  const title = isDownload ? "Límite de Descargas Alcanzado" : "Límite de Uploads Alcanzado"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .wrapper {
      padding: 40px 20px;
      min-height: 100vh;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      padding: 48px 32px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: white;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px 32px;
    }
    .content p {
      color: #475569;
      line-height: 1.7;
      font-size: 16px;
      margin: 0 0 16px 0;
    }
    .warning {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border-left: 4px solid #ef4444;
      padding: 24px;
      border-radius: 12px;
      margin: 28px 0;
    }
    .warning p {
      margin: 0;
      color: #991b1b;
      font-weight: 500;
    }
    .plan-info {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
      border: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 24px;
      box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);
    }
    .footer {
      padding: 32px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.userName}</strong>,</p>
        
        <div class="warning">
          <p>${data.limitMessage}</p>
        </div>

        <div class="plan-info">
          <p style="margin: 0;"><strong>Plan actual:</strong> ${data.planName}</p>
        </div>

        <p>Mejorá tu plan para seguir disfrutando de ARSOUND sin límites.</p>

        <div style="text-align: center;">
          <a href="${data.upgradeUrl}" class="button">Mejorar Plan</a>
        </div>
      </div>
      <div class="footer">
        <div style="font-size: 18px; font-weight: 700; color: #6366f1; margin-bottom: 8px;">ARSOUND</div>
        <div>Plataforma para productores musicales</div>
      </div>
    </div>
  </div>
</body>
</html>
`
}
