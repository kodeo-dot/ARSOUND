# ARSOUND - Guía de Integración

## ✅ Fixes Implementados

### 1. Sistema de Avatares

**Problema resuelto:**
- El bucket `avatars` no existía en Supabase Storage
- Las imágenes se subían pero no se mostraban

**Solución implementada:**
- ✅ Creado script SQL: `scripts/009_create_avatars_bucket.sql`
- ✅ Configuradas políticas RLS para el bucket avatars
- ✅ Los usuarios pueden subir, actualizar y eliminar sus propios avatares
- ✅ Cualquiera puede ver los avatares (bucket público)

**Cómo ejecutar:**
1. Ve a la pestaña "SQL" en el chat de v0
2. Ejecuta el script `009_create_avatars_bucket.sql`
3. Recarga tu perfil y sube una nueva foto

---

### 2. Sistema de Planes de Suscripción

**Problema resuelto:**
- Los usuarios nuevos no tenían plan asignado por defecto
- No había manera de actualizar planes desde la base de datos

**Solución implementada:**
- ✅ Creado trigger automático: `scripts/010_add_default_plan_trigger.sql`
- ✅ Nuevos usuarios reciben plan 'free' automáticamente
- ✅ Usuarios existentes sin plan reciben 'free' (backfill incluido)
- ✅ Funciones servidor para gestionar planes: `lib/plans-actions.ts`

**Cómo ejecutar:**
1. Ejecuta el script `010_add_default_plan_trigger.sql` en Supabase
2. Todos los usuarios nuevos tendrán plan 'free' por defecto

**Cómo cambiar planes manualmente (para testing):**

En la consola SQL de Supabase:
\`\`\`sql
-- Ver el plan actual de un usuario
SELECT * FROM user_plans WHERE user_id = 'tu-user-id';

-- Cambiar a plan "De 0 a Hit"
INSERT INTO user_plans (user_id, plan_type, is_active, expires_at)
VALUES ('tu-user-id', 'de_0_a_hit', true, NULL)
ON CONFLICT (user_id) DO UPDATE 
SET plan_type = 'de_0_a_hit', is_active = true;

-- Cambiar a plan "Studio Plus"
INSERT INTO user_plans (user_id, plan_type, is_active, expires_at)
VALUES ('tu-user-id', 'studio_plus', true, NULL)
ON CONFLICT (user_id) DO UPDATE 
SET plan_type = 'studio_plus', is_active = true;
\`\`\`

Desde el código (para testing):
\`\`\`typescript
import { testChangePlan } from '@/lib/plans-actions'

// Cambia el plan del usuario actual
await testChangePlan('de_0_a_hit')
await testChangePlan('studio_plus')
await testChangePlan('free')
\`\`\`

---

## 🔄 Integración de Pagos (Pendiente)

### Archivos preparados para Stripe/MercadoPago:

1. **`app/plans/actions.ts`**
   - Server action para manejar selección de planes
   - Comentarios con código de ejemplo para Stripe
   - TODO: Crear sesión de pago y redirigir

2. **`app/api/webhooks/stripe/route.ts`**
   - Webhook handler para eventos de Stripe
   - TODO: Verificar firma, activar planes en DB
   - Maneja: checkout.session.completed, customer.subscription.deleted

3. **`lib/plans-actions.ts`**
   - `updateUserPlan()`: Actualiza plan en la DB (llamar desde webhook)
   - `getUserPlan()`: Obtiene plan activo del usuario
   - `testChangePlan()`: Para testing manual

### Pasos para integrar pagos:

**Con Stripe:**
1. Instalar: `npm install stripe`
2. Agregar variables de entorno:
   \`\`\`
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   \`\`\`
3. Crear productos y precios en Stripe Dashboard
4. Descomentar código en `app/plans/actions.ts`
5. Descomentar código en `app/api/webhooks/stripe/route.ts`
6. Configurar webhook en Stripe → `https://tu-dominio.com/api/webhooks/stripe`

**Con MercadoPago:**
1. Instalar: `npm install mercadopago`
2. Seguir documentación de MercadoPago para crear preferencias de pago
3. Usar la misma estructura: crear sesión → webhook → updateUserPlan()

---

## 🗂️ Estructura de la Base de Datos

### Tabla: `user_plans`
\`\`\`sql
CREATE TABLE user_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  plan_type TEXT CHECK (plan_type IN ('free', 'de_0_a_hit', 'studio_plus')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- NULL = sin vencimiento (plan free)
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
\`\`\`

### Función RPC: `get_user_plan(user_id UUID)`
- Retorna el plan activo del usuario
- Si no hay plan o expiró → retorna 'free'
- Usado en todo el frontend para verificar permisos

---

## 📋 Checklist de Implementación

### Avatares
- [x] Crear bucket en Supabase Storage
- [x] Configurar políticas RLS
- [x] Implementar lógica de subida (ya existía)
- [x] Implementar preview antes de guardar (ya existía)
- [x] Mostrar avatar en perfil público
- [x] Mostrar avatar en perfil privado
- [ ] Ejecutar script SQL en tu proyecto

### Planes
- [x] Crear trigger para plan por defecto
- [x] Backfill usuarios existentes
- [x] Funciones servidor para gestionar planes
- [x] Preparar archivos para integración de pagos
- [ ] Ejecutar script SQL en tu proyecto
- [ ] Configurar Stripe/MercadoPago (cuando estés listo)

---

## 🧪 Testing

### Probar avatares:
1. Ejecuta `009_create_avatars_bucket.sql`
2. Ve a tu perfil → Editar Perfil
3. Sube una foto (max 5MB)
4. Guarda cambios
5. Recarga la página → la foto debe aparecer

### Probar planes:
1. Ejecuta `010_add_default_plan_trigger.sql`
2. Crea un nuevo usuario → debe tener plan 'free'
3. Cambia el plan manualmente en SQL (ver arriba)
4. Ve a tu perfil → verifica que las características cambien según el plan
5. Ve a Estadísticas → solo Studio Plus ve gráficos

### Límites por plan:
- **Free**: 3 packs totales, 10% comisión, sin estadísticas avanzadas
- **De 0 a Hit**: 10 packs/mes, 5% comisión, estadísticas básicas (4 cards)
- **Studio Plus**: Ilimitado, 0% comisión, estadísticas completas (gráficos)

---

## 🚀 Próximos Pasos

1. **Ejecutar scripts SQL** en Supabase (009 y 010)
2. **Probar subida de avatares** en desarrollo
3. **Probar cambio de planes** manualmente
4. **Cuando estés listo para pagos:**
   - Configurar cuenta de Stripe/MercadoPago
   - Descomentar código en archivos preparados
   - Testear flujo completo de pago → webhook → activación

---

¿Preguntas? Todos los archivos tienen comentarios detallados explicando cómo funcionan. 🎯
