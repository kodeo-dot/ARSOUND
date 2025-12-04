-- Adding subgenre column to packs table
ALTER TABLE public.packs 
ADD COLUMN IF NOT EXISTS subgenre text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS packs_subgenre_idx ON public.packs(subgenre);

-- Update existing packs to have null subgenre (they can be updated later)
COMMENT ON COLUMN public.packs.subgenre IS 'Musical subgenre classification';
