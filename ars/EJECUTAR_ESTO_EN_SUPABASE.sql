-- COPIA Y PEGA ESTE SCRIPT COMPLETO EN EL SQL EDITOR DE SUPABASE
-- Dashboard -> SQL Editor -> New Query -> Pegar esto -> Run

-- Adding constraint update to allow 'comment' and 'reply' notification types
-- 1. Actualizar constraint de notificaciones para incluir comment y reply
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow', 'like', 'purchase', 'limit_reached', 'download', 'profile_view', 'comment', 'reply'));

-- 2. Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS pack_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pack_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_pack_comments_pack_id ON pack_comments(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_user_id ON pack_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_parent_id ON pack_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_created_at ON pack_comments(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE pack_comments ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "Anyone can view comments" ON pack_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON pack_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON pack_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON pack_comments;

-- 6. Crear políticas RLS
CREATE POLICY "Anyone can view comments"
  ON pack_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON pack_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON pack_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON pack_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Crear función para notificaciones de comentarios
CREATE OR REPLACE FUNCTION notify_pack_owner_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_pack_owner_id UUID;
  v_pack_title TEXT;
  v_commenter_username TEXT;
BEGIN
  -- Using title instead of name since packs table has title column
  SELECT user_id, title INTO v_pack_owner_id, v_pack_title
  FROM packs WHERE id = NEW.pack_id;
  
  -- Get commenter username
  SELECT username INTO v_commenter_username
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if commenting on own pack
  IF v_pack_owner_id != NEW.user_id AND NEW.parent_id IS NULL THEN
    INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
    VALUES (
      v_pack_owner_id,
      'comment',
      NEW.user_id,
      NEW.pack_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'pack_name', v_pack_title,
        'commenter', v_commenter_username
      )
    );
  END IF;
  
  -- Notify parent comment author if this is a reply
  IF NEW.parent_id IS NOT NULL THEN
    DECLARE
      v_parent_author_id UUID;
    BEGIN
      SELECT user_id INTO v_parent_author_id
      FROM pack_comments WHERE id = NEW.parent_id;
      
      -- Don't notify if replying to yourself
      IF v_parent_author_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, actor_id, pack_id, metadata)
        VALUES (
          v_parent_author_id,
          'reply',
          NEW.user_id,
          NEW.pack_id,
          jsonb_build_object(
            'comment_id', NEW.id,
            'parent_id', NEW.parent_id,
            'pack_name', v_pack_title,
            'commenter', v_commenter_username
          )
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Eliminar trigger viejo si existe
DROP TRIGGER IF EXISTS on_comment_created ON pack_comments;

-- 9. Crear trigger para notificaciones
CREATE TRIGGER on_comment_created
  AFTER INSERT ON pack_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_pack_owner_on_comment();

-- 10. Listo! Ahora intenta hacer un comentario de nuevo
