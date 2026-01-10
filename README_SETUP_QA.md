# Setup de Preguntas y Respuestas

## Problema
Cuando intentás hacer una pregunta obtenés un error 500 porque las tablas de Q&A no existen en la base de datos.

## Solución

### Paso 1: Ejecutar el script SQL
Ve al dashboard de Supabase:
1. Abrí https://supabase.com/dashboard
2. Seleccioná tu proyecto
3. Andá a "SQL Editor"
4. Copiá y pegá el contenido del archivo `scripts/109_create_qa_tables_consolidated.sql`
5. Hacé click en "Run" para ejecutar el script

### Paso 2: Verificar que las tablas se crearon
En el SQL Editor, ejecutá:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pack_questions', 'pack_answers');
```

Deberías ver ambas tablas listadas.

### Paso 3: Verificar las políticas RLS
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('pack_questions', 'pack_answers');
```

Deberías ver las políticas de seguridad para cada tabla.

## Qué hace este script
- Crea la tabla `pack_questions` para almacenar preguntas
- Crea la tabla `pack_answers` para almacenar respuestas
- Configura índices para mejor performance
- Habilita Row Level Security (RLS)
- Crea políticas para que:
  - Cualquiera pueda ver preguntas y respuestas
  - Usuarios autenticados puedan hacer preguntas y responder
  - Los usuarios solo puedan borrar sus propias preguntas/respuestas

## Próximos pasos
Después de ejecutar el script, actualizá la página y probá hacer una pregunta. Debería funcionar correctamente.

Las notificaciones se crearán automáticamente cuando ejecutes el script `107_add_review_and_qa_notifications.sql` que contiene los triggers.
