# Configuración Final para Pagos

## PASO 1: Ejecutar el Script SQL

1. Ve a tu **Dashboard de Supabase**
2. Abre **SQL Editor**
3. Copia y ejecuta TODO el contenido de `scripts/fix_purchases_rls.sql`

Esto actualiza los permisos (RLS) para que el webhook pueda insertar compras.

## PASO 2: Esperar el Webhook de Mercado Pago

- Cuando hagas un pago en Mercado Pago y lo apruebes, Mercado Pago enviará un webhook
- El webhook procesa la compra y la guarda en la BD
- **Esto toma 1-5 segundos**

## PASO 3: Verificar que funciona

1. Completa una compra de prueba (usa tarjeta 4111 1111 1111 1111)
2. Vuelve a tu perfil
3. Abre la pestaña "Compras"
4. Deberías ver tu compra listada
5. El botón "Descargar" funcionará

## ¿Por qué pasó esto?

- El webhook estaba usando `NEXT_PUBLIC_SUPABASE_ANON_KEY` (clave pública)
- Las claves públicas tienen restricciones RLS
- El servicio no podía insertar en `purchases`
- Ahora usa `SUPABASE_SERVICE_ROLE_KEY` que no tiene restricciones

## Troubleshooting

Si aún no funciona:
1. Verifica que ejecutaste el script SQL ✓
2. Verifica que tus variables de entorno están completas
3. Mira los logs en la consola del navegador (F12)
4. Chequea los logs del servidor en Vercel
