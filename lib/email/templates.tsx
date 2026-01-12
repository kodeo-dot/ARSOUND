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
  <style>
    body {
      margin: 0;
      background: #0f172a;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
    }
    .wrapper {
      padding: 40px 16px;
    }
    .card {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,.25);
    }
    .header {
      padding: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      text-align: center;
    }
    .content {
      padding: 32px;
    }
    h1 {
      margin: 0;
      font-size: 26px;
    }
    p {
      color: #334155;
      line-height: 1.6;
      font-size: 15px;
    }
    .code {
      background: #f1f5f9;
      border-radius: 10px;
      padding: 16px;
      font-family: monospace;
      font-size: 18px;
      text-align: center;
      margin: 24px 0;
      letter-spacing: 1px;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      margin-top: 16px;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      background: #f8fafc;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1>🎧 Compra confirmada</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${data.buyerName}</strong>,</p>
        <p>Gracias por comprar <strong>${data.packTitle}</strong>.</p>
        <p><strong>Monto:</strong> $${data.amount}</p>

        <p>Tu código de descarga:</p>
        <div class="code">${data.purchaseCode}</div>

        <a href="${data.downloadUrl}" class="button">Descargar pack</a>
      </div>
      <div class="footer">
        ARSOUND · Plataforma para productores musicales
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
  <style>
    body {
      background: #020617;
      font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 40px 16px;
    }
    .card {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 32px;
      text-align: center;
    }
    .content {
      padding: 32px;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #10b981;
      margin: 16px 0;
    }
    .meta {
      font-size: 13px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>💸 Nueva venta</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${data.sellerName}</strong>,</p>
      <p>${data.buyerName} compró <strong>${data.packTitle}</strong>.</p>

      <div class="amount">$${data.earnings}</div>
      <div class="meta">Comisión: $${data.commission}</div>
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
  <style>
    body {
      background: #020617;
      padding: 40px 16px;
      font-family: Inter, sans-serif;
    }
    .card {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      padding: 32px;
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: white;
      text-align: center;
    }
    .content {
      padding: 32px;
    }
    .info {
      background: #fffbeb;
      padding: 20px;
      border-radius: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚀 ${data.planName} activo</h1>
    </div>
    <div class="content">
      <p>Hola ${data.userName},</p>
      <div class="info">
        <p><strong>Plan:</strong> ${data.planName}</p>
        <p><strong>Monto:</strong> $${data.amount}</p>
        <p><strong>Vence:</strong> ${data.expiresAt}</p>
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
  const emoji = isDownload ? "📥" : "📤"
  const title = isDownload ? "Límite de descargas alcanzado" : "Límite de uploads alcanzado"

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      background: #020617;
      padding: 40px 16px;
      font-family: Inter, sans-serif;
    }
    .card {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      padding: 32px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 32px;
    }
    .warning {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      padding: 16px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #6366f1;
      color: white;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>${emoji} ${title}</h1>
    </div>
    <div class="content">
      <p>Hola ${data.userName},</p>
      <div class="warning">${data.limitMessage}</div>
      <p>Plan actual: <strong>${data.planName}</strong></p>
      <a href="${data.upgradeUrl}" class="button">Mejorar plan</a>
    </div>
  </div>
</body>
</html>
`
}
