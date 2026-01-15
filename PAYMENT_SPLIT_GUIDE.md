# Sistema de División de Pagos - Arsound

## Problema Original

Mercado Pago no divide automáticamente los pagos usando solo `collector_id` y `application_fee` cuando se usa el Access Token del marketplace. Esta funcionalidad requiere configuración adicional de OAuth y permisos especiales.

## Solución Implementada

**Sistema de Transferencias Automáticas Post-Pago**

### Flujo de Pago

1. **Usuario compra un pack** → Todo el dinero va a la cuenta de Arsound (Marketplace)
2. **Webhook recibe confirmación** → Se procesa el pago aprobado
3. **Sistema calcula comisión** → Según el plan del vendedor:
   - Free: 30% comisión
   - De 0 a Hit: 10% comisión  
   - Studio Plus: 5% comisión
4. **Transferencia automática** → Si el vendedor tiene MP conectado, se transfiere su parte automáticamente
5. **Registro en DB** → Se guarda toda la información (comisión, ganancia vendedor, estado de transferencia)

### Ejemplo de División

**Pack de $1000 - Vendedor con plan Studio Plus (5% comisión)**
- Total pagado por comprador: $1000
- Arsound recibe inicialmente: $1000
- Comisión Arsound (5%): $50
- Ganancia vendedor (95%): $950
- **Transferencia automática: $950 al vendedor**

### Archivos Modificados

1. **`lib/payments/mercadopago/preference.ts`**
   - Removido `collector_id` y `application_fee` 
   - Agregado `needs_transfer` en metadata
   - Todo el dinero va a Arsound primero

2. **`lib/payments/mercadopago/transfer.ts`** (NUEVO)
   - Función `createTransferToSeller()` usando Money Requests API
   - Maneja errores y logs detallados

3. **`lib/payments/mercadopago/webhook.ts`**
   - Después de procesar pago aprobado, intenta transferencia automática
   - Si el vendedor tiene `mp_user_id` y `mp_connected = true`, se ejecuta la transferencia
   - Logs completos del proceso de transferencia

### Logs para Debugging

Cuando compres un pack, verás en la consola del servidor:

\`\`\`
[v0] 💰 Creating pack preference - Arsound receives all, will transfer to seller
[v0] 🎯 WEBHOOK: Processing pack purchase
[v0] 💵 WEBHOOK: FINAL PAYMENT SPLIT
[v0] 💸 WEBHOOK: Seller has MP connected, attempting transfer
[v0] 📤 Transfer request data
[v0] ✅ Transfer created successfully
\`\`\`

### Requisitos para que Funcione

1. **Vendedor debe conectar Mercado Pago** en Settings
2. **OAuth debe estar funcionando** para obtener `mp_user_id`
3. **Access Token de Arsound** debe tener permisos de `money-requests`

### Verificación

Para verificar que está funcionando:

1. Compra un pack de prueba
2. Revisa los logs en el servidor (webhook)
3. Verifica en admin/purchases que aparecen:
   - Ganancia Plataforma (comisión)
   - Ganancia Creador (lo que se transfiere)
   - MP User ID Vendedor (debe estar presente)
4. El vendedor debe recibir una notificación de Money Request en su cuenta MP

### Alternativa Manual

Si las transferencias automáticas fallan, los datos quedan registrados en la tabla `purchases`:
- `seller_earnings` / `creator_earnings`: Monto que debe recibir el vendedor
- `seller_mp_user_id`: ID de MP del vendedor
- `platform_commission` / `platform_earnings`: Lo que se queda Arsound

Esto permite hacer transferencias manuales si es necesario.
