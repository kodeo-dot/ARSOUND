-- Add product type and DAW compatibility fields to packs table
-- This migration adds support for Sample Packs, MIDI Packs, and Presets

-- Add product_type column (default to 'sample_pack' for backward compatibility)
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'sample_pack' CHECK (product_type IN ('sample_pack', 'midi_pack', 'preset'));

-- Add DAW compatibility array column
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS daw_compatibility text[] DEFAULT ARRAY[]::text[];

-- Add plugin field for presets
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS plugin text;

-- Add subgenre column if it doesn't exist (from previous migration)
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS subgenre text;

-- Add file_hash column if it doesn't exist (for duplicate detection)
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS file_hash text;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS packs_product_type_idx ON public.packs(product_type);
CREATE INDEX IF NOT EXISTS packs_genre_idx ON public.packs(genre);
CREATE INDEX IF NOT EXISTS packs_daw_compatibility_idx ON public.packs USING GIN(daw_compatibility);

-- Update existing packs to have product_type = 'sample_pack'
UPDATE public.packs 
SET product_type = 'sample_pack' 
WHERE product_type IS NULL;

COMMENT ON COLUMN public.packs.product_type IS 'Type of product: sample_pack, midi_pack, or preset';
COMMENT ON COLUMN public.packs.daw_compatibility IS 'Array of compatible DAWs: FL Studio, Ableton Live, Logic Pro, Cubase, Reaper, Universal, etc.';
COMMENT ON COLUMN public.packs.plugin IS 'Plugin or instrument name (for presets only)';
