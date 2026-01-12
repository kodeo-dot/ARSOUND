-- Add tags column to packs table
alter table public.packs
add column if not exists tags text[] default array[]::text[];

-- Add discount columns to packs table
alter table public.packs
add column if not exists has_discount boolean default false,
add column if not exists discount_percent integer default 0;

-- Create index for tags
create index if not exists packs_tags_idx on public.packs using gin(tags);

-- Update packs table to include instruments
alter table public.packs
add column if not exists instruments text[] default array[]::text[];
