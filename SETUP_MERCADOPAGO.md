# Configuración de Mercado Pago para ARSOUND

## Variables de Entorno Requeridas

Para que funcione el sistema de pagos y conexión con Mercado Pago, necesitás agregar estas variables de entorno a tu proyecto:

### 1. En Vercel (Variables de Entorno)

Agregá estas variables en tu proyecto de Vercel (Settings > Environment Variables):

\`\`\`bash
# Mercado Pago OAuth
MERCADO_PAGO_APP_ID=tu_app_id_de_mercadopago
MERCADO_PAGO_CLIENT_SECRET=tu_client_secret_de_mercadopago

# URL de tu aplicación (para callbacks de OAuth)
NEXT_PUBLIC_APP_URL=https://arsound.com.ar

# Token de acceso de la plataforma (para recibir comisiones)
MERCADO_PAGO_ACCESS_TOKEN=tu_access_token
MERCADO_PAGO_PUBLIC_KEY=tu_public_key
\`\`\`

### 2. Cómo obtener las credenciales de Mercado Pago

1. **Creá una aplicación en Mercado Pago:**
   - Andá a: https://www.mercadopago.com.ar/developers/panel/app
   - Creá una nueva aplicación
   - Tipo: Marketplace / Pagos en línea

2. **Configurá la URL de Redirect:**
   - En tu aplicación de Mercado Pago, configurá la URL de callback:
   - Desarrollo: `http://localhost:3000/api/mercadopago/callback`
   - Producción: `https://arsound.vercel.app/api/mercadopago/callback`

3. **Copiá las credenciales:**
   - `MERCADO_PAGO_APP_ID`: El ID de tu aplicación
   - `MERCADO_PAGO_CLIENT_SECRET`: El Client Secret de tu aplicación
   - `MERCADO_PAGO_ACCESS_TOKEN`: Tu Access Token (para recibir las comisiones)
   - `MERCADO_PAGO_PUBLIC_KEY`: Tu Public Key

### 3. URLs de Redirect según ambiente

**Desarrollo Local:**
\`\`\`
http://localhost:3000/api/mercadopago/callback
\`\`\`

**Producción:**
\`\`\`
https://arsound.com.ar/api/mercadopago/callback
\`\`\`

### 4. Permisos requeridos

Tu aplicación de Mercado Pago debe tener estos permisos (scopes):
- `read` - Para leer información del usuario
- `write` - Para procesar pagos
- `offline_access` - Para mantener la conexión activa

### 5. Testing

Para probar en ambiente de desarrollo:
1. Usá las credenciales de TEST de Mercado Pago
2. Usá tarjetas de prueba: https://www.mercadopago.com.ar/developers/es/docs/testing/test-cards

### 6. Documentación oficial

- OAuth de Mercado Pago: https://www.mercadopago.com.ar/developers/es/docs/marketplace/oauth
- Split Payments: https://www.mercadopago.com.ar/developers/es/docs/marketplace/split-payments
