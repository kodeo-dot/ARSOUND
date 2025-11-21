-- Agregar columna file_hash a la tabla packs si no existe
ALTER TABLE packs
ADD COLUMN IF NOT EXISTS file_hash TEXT UNIQUE;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_packs_file_hash ON packs(file_hash);
