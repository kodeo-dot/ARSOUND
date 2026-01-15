# Guía de configuración OAuth Split Payments - ARSOUND

## Problema Resuelto

El dinero de las compras de packs ahora se divide automáticamente entre el vendedor y Arsound usando el sistema OAuth de Mercado Pago.

## Cómo Funciona

### Para Vendedores (Creadores de Packs)

1. El vendedor debe conectar su cuenta de Mercado Pago en **Configuración** (Settings)
2. Esto autoriza a ARSOUND a crear pagos en su nombre mediante OAuth
3. Cuando un usuario compra un pack, Mercado Pago divide automáticamente el dinero:
   - El vendedor recibe su parte (precio - comisión) **directamente en su cuenta MP**
   - ARSOUND recibe la comisión (5%, 10%, o 30% según el plan del vendedor)

### Requisitos Técnicos

Según la documentación oficial de Mercado Pago para marketplace split payments:

1. **Access Token del Vendedor**: Se obtiene mediante OAuth (ya implementado en `/app/settings`)
2. **Crear preferencia con token del vendedor**: La preferencia de pago se crea usando el access_token del vendedor, NO el de Arsound
3. **marketplace_fee**: Se especifica la comisión que Arsound se queda

## Código Actualizado

### `lib/payments/mercadopago/preference.ts`

\`\`\`typescript
// Detecta si el vendedor tiene OAuth conectado
const hasSellerToken = sellerProfile.mp_connected && !!sellerProfile.mp_access_token

if (hasSellerToken) {
  // Agrega marketplace_fee para que MP divida el dinero
  preferenceData.marketplace_fee = commissionAmount
  
  // Crea la preferencia con el access token del VENDEDOR
  return await createPreferenceWithToken(preferenceData, sellerProfile.mp_access_token!)
} else {
  // Si el vendedor no está conectado, todo va a Arsound
  return await createPreference(preferenceData)
}
\`\`\`

### `lib/payments/mercadopago/webhook.ts`

\`\`\`typescript
// El webhook detecta si se usó OAuth split
if (metadata.uses_oauth_split) {
  // MP ya dividió el dinero automáticamente - no hacer nada más
  console.log("OAuth split usado - MP ya dividió el pago")
} else {
  // Intentar transferencia manual (fallback)
  await createTransferToSeller(...)
}
\`\`\`

## Verificación

Cuando hagas una compra de prueba, verás en la consola del navegador:

\`\`\`
[v0] 💰 Creating pack preference with OAuth split
  - usesOAuthSplit: true
  - marketplace_fee: $XX.XX
  - seller_will_receive: $YY.YY

[v0] ✅ WEBHOOK: OAuth split was used - Mercado Pago already divided the payment automatically
  - sellerReceived: $YY.YY
  - arsoundReceived: $XX.XX
\`\`\`

## Importante

Para que esto funcione, necesitas tener habilitado **Checkout Pro con Marketplace** en tu cuenta de Mercado Pago. Si solo tienes "Checkout Pro" básico, el split NO funcionará.

Contacta a Mercado Pago para habilitar las funcionalidades de Marketplace si aún no las tienes.

## Referencias

- [Documentación oficial: Integrate checkout in marketplace](https://www.mercadopago.com.ar/developers/en/docs/checkout-pro/how-tos/integrate-marketplace)
- [OAuth en Mercado Pago](https://www.mercadopago.com.ar/developers/en/docs/security/oauth/introduction)
