# ARSOUND Database Setup Guide

## Automatic Setup

La base de datos se configurará automáticamente cuando despliegues la aplicación en Vercel.

### Para Vercel (Producción)

1. **Conecta tu Supabase** desde el panel de Vercel
2. **Las variables de entorno se cargarán automáticamente**
3. **Las tablas se crearán en el primer acceso**

### Para Desarrollo Local

1. **Crea un proyecto en Supabase** (https://supabase.com)
2. **Copia las variables de entorno** a tu `.env.local`:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   \`\`\`

3. **Ejecuta los scripts SQL** en el SQL Editor de Supabase:
   - `scripts/001_create_profiles_table.sql`
   - `scripts/002_create_packs_table.sql`
   - `scripts/003_create_pack_likes_table.sql`
   - `scripts/004_create_purchases_table.sql`
   - `scripts/005_create_pack_downloads_table.sql`
   - `scripts/006_create_discount_codes_table.sql`
   - `scripts/007_create_followers_table.sql`
   - `scripts/008_create_functions.sql`

## Tablas Creadas

### profiles
- Información del usuario y plan
- Estadísticas (followers, sales, etc.)

### packs
- Sample packs subidos
- Información de precios y descuentos
- Estadísticas (likes, downloads, plays)

### pack_likes
- Likes que los usuarios hacen a packs

### purchases
- Compras realizadas con comisiones calculadas

### pack_downloads
- Descargas de packs gratis (con límites por plan)

### discount_codes
- Códigos de descuento por pack

### followers
- Sistema de seguimiento entre usuarios

## Funciones RPC Disponibles

- `get_remaining_downloads(user_id)` - Descargas restantes del mes
- `get_remaining_uploads(user_id)` - Packs que puede subir el usuario
- `can_download_free_pack(user_id, pack_id)` - Verifica si puede descargar

## Troubleshooting

Si ves errores de "table not found":
1. Verifica que estés conectado a Supabase
2. Ejecuta los scripts SQL en orden
3. Recarga la aplicación
