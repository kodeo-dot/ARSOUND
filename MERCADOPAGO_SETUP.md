# Guía de Integración con Mercado Pago

## Configuración Inicial

### 1. Crear cuenta de Mercado Pago
1. Visitá https://www.mercadopago.com.ar/developers
2. Creá una cuenta de desarrollador
3. Activá las credenciales de prueba y producción

### 2. Obtener Credenciales

**Credenciales de Prueba (para desarrollo):**
1. Ingresá a tu panel de desarrolladores
2. Ve a "Tus integraciones"
3. Copiá el `Access Token` de prueba
4. Copiá la `Public Key` de prueba

**Credenciales de Producción (para ir en vivo):**
1. Completá el proceso de verificación de tu cuenta
2. Ve a "Tus integraciones" → "Credenciales de producción"
3. Copiá el `Access Token` de producción
4. Copiá la `Public Key` de producción

### 3. Configurar Variables de Entorno

Creá o actualizá tu archivo `.env.local`:

\`\`\`bash
# Para desarrollo (usar credenciales de prueba)
MERCADO_PAGO_ACCESS_TOKEN=TEST-1198984687200600-111414-88ec6350a433f2fb1547e9b91eea7b6c-231259676
MERCADO_PAGO_PUBLIC_KEY=TEST-d02df8db-9796-477a-bfa0-bc0485c6e9b4

# URL de tu aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Instalar SDK de Mercado Pago

\`\`\`bash
npm install mercadopago
\`\`\`

### 5. Activar el Código Real en los Endpoints

**En `app/api/mercadopago/create-preference/route.ts`:**

Descomentá el código de Mercado Pago (líneas marcadas con TODO) y comentá el mock response.

**En `app/api/webhooks/mercadopago/route.ts`:**

Descomentá el código de Mercado Pago (líneas marcadas con TODO) y comentá el mock payment data.

### 6. Configurar Webhook en Mercado Pago

1. Ve a tu panel de desarrolladores en Mercado Pago
2. Seleccioná tu aplicación
3. En "Webhooks" o "Notificaciones IPN", agregá:
   - URL: `https://tu-dominio.com/api/webhooks/mercadopago`
   - Eventos: Seleccioná "Pagos"

**Para testing local con ngrok:**
\`\`\`bash
ngrok http 3000
# Usá la URL de ngrok + /api/webhooks/mercadopago
\`\`\`

## Flujo de Pago

### Para Planes de Suscripción

1. Usuario selecciona un plan en `/plans`
2. Click en "Pagar con Mercado Pago"
3. Se crea una preferencia de pago con Mercado Pago
4. Usuario es redirigido al checkout de Mercado Pago
5. Completa el pago
6. Mercado Pago envía webhook a tu servidor
7. El webhook actualiza el plan del usuario en Supabase
8. Usuario es redirigido a `/payment/success`

### Para Compra de Packs

1. Usuario ve un pack en `/pack/[id]`
2. Click en "Comprar Ahora"
3. Se redirige a `/pack/[id]/checkout`
4. Aplica código de descuento (opcional)
5. Click en "Confirmar compra"
6. Se crea una preferencia de pago con Mercado Pago
7. Usuario es redirigido al checkout de Mercado Pago
8. Completa el pago
9. Mercado Pago envía webhook a tu servidor
10. El webhook registra la compra en la tabla `purchases`
11. Usuario es redirigido a la página de descarga

## Testing con Usuarios de Prueba

Mercado Pago proporciona usuarios de prueba para simular pagos:

**Tarjetas de Prueba:**
- Aprobada: 5031 7557 3453 0604 (MASTERCARD)
- Rechazada: 5031 4332 1540 6351 (MASTERCARD)
- CVV: 123
- Fecha: Cualquier fecha futura
- Titular: APRO (aprobada) o OTHE (rechazada)

Más información: https://www.mercadopago.com.ar/developers/es/guides/additional-content/your-integrations/test-cards

## Pasar a Producción

1. Verificá tu cuenta de Mercado Pago (completá la info de tu negocio)
2. Reemplazá las credenciales de prueba por las de producción en `.env.local`
3. Actualizá la URL del webhook en el panel de Mercado Pago
4. Probá un pago real con una tarjeta verdadera (puede ser de bajo monto)
5. Verificá que el webhook se ejecute correctamente

## Solución de Problemas

### El webhook no se ejecuta
- Verificá que la URL del webhook sea accesible públicamente
- Revisá los logs de Mercado Pago en el panel de desarrolladores
- Asegurate de que NEXT_PUBLIC_APP_URL esté correctamente configurado

### Error al crear preferencia
- Verificá que MERCADO_PAGO_ACCESS_TOKEN esté configurado
- Revisá que los montos sean mayores a 0
- Confirmá que la moneda sea "ARS"

### Pago aprobado pero plan no actualizado
- Revisá los logs del webhook en tu servidor
- Verificá que el `external_reference` tenga el formato correcto
- Confirmá que las tablas de Supabase tengan los permisos RLS correctos

## Seguridad

- Nunca expongas las credenciales de producción en el código
- Usá variables de entorno para almacenar las credenciales
- Validá todas las notificaciones de webhook
- Implementá rate limiting en tus endpoints
- Registrá todos los eventos de pago para auditoría

## Recursos

- [Documentación oficial de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs)
- [SDKs de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/sdks-library/landing)
- [Tarjetas de prueba](https://www.mercadopago.com.ar/developers/es/guides/additional-content/your-integrations/test-cards)
- [Panel de desarrolladores](https://www.mercadopago.com.ar/developers/panel)
