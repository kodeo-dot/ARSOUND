# Setup del Sistema de Comentarios

El sistema de comentarios ya está casi configurado. Solo necesitas ejecutar un script SQL en tu dashboard de Supabase.

## Pasos:

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/xkihemwzofnwadhhyibq
2. En el menú lateral, haz clic en **SQL Editor**
3. Haz clic en **New Query**
4. Copia y pega todo el contenido del archivo `scripts/114_setup_comments_rls.sql`
5. Haz clic en **Run** (o presiona Ctrl+Enter)

## Qué hace este script:

- ✅ Configura las políticas de RLS para que usuarios autenticados puedan comentar
- ✅ Permite que todos puedan ver los comentarios
- ✅ Permite que usuarios puedan editar/eliminar sus propios comentarios
- ✅ Crea triggers automáticos para notificaciones cuando:
  - Alguien comenta en tu pack
  - Alguien responde a tu comentario

## Después de ejecutar el script:

El sistema de comentarios debería funcionar completamente. Podrás:
- Ver comentarios en la página del pack
- Crear nuevos comentarios
- Responder a comentarios existentes
- Recibir notificaciones automáticas

Si encuentras algún error, revisa la consola del navegador para más detalles.
