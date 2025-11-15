-- Change bpm column from integer to text to support BPM ranges
ALTER TABLE public.packs ALTER COLUMN bpm TYPE text;
