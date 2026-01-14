-- Create discount codes table
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references public.packs(id) on delete cascade not null,
  code text not null,
  discount_percent integer not null check (discount_percent > 0 and discount_percent <= 50),
  for_all_users boolean default false,
  for_first_purchase boolean default false,
  for_followers boolean default false,
  uses_count integer default 0,
  max_uses integer,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(pack_id, code)
);

-- Enable RLS
alter table public.discount_codes enable row level security;

-- RLS Policies
create policy "Discount codes are viewable by everyone"
  on public.discount_codes for select
  using (true);

create policy "Pack owners can manage discount codes"
  on public.discount_codes for all
  using (
    exists (
      select 1 from public.packs
      where packs.id = discount_codes.pack_id
      and packs.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
create index if not exists discount_codes_pack_id_idx on public.discount_codes(pack_id);
create index if not exists discount_codes_code_idx on public.discount_codes(code);
