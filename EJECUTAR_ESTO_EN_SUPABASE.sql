-- COPIA Y PEGA ESTE SCRIPT COMPLETO EN EL SQL EDITOR DE SUPABASE
-- Dashboard -> SQL Editor -> New Query -> Pegar esto -> Run

-- 1. Crear tabla de comentarios
CREATE TABLE IF NOT EXISTS pack_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pack_comments(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_pack_comments_pack_id ON pack_comments(pack_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_user_id ON pack_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_parent_id ON pack_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_pack_comments_created_at ON pack_comments(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE pack_comments ENABLE ROW LEVEL SECURITY;

-- 4. Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "Anyone can view comments" ON pack_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON pack_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON pack_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON pack_comments;

-- 5. Crear políticas RLS
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

-- 6. Listo! Ahora intenta hacer un comentario de nuevo
