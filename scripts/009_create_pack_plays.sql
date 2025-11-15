-- Crear tabla para contar reproducciones de cada pack
create table if not exists public.pack_plays (
  id uuid default gen_random_uuid() primary key,
  pack_id uuid references public.packs(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  played_at timestamp with time zone default now() not null,
  ip_address text,
  created_at timestamp with time zone default now()
);

-- Add index for faster queries
create index if not exists pack_plays_pack_id_idx on public.pack_plays(pack_id);
create index if not exists pack_plays_played_at_idx on public.pack_plays(played_at desc);

-- RLS policies
alter table public.pack_plays enable row level security;

create policy "Anyone can insert pack plays"
  on public.pack_plays for insert
  to authenticated, anon
  with check (true);

create policy "Pack plays are viewable by everyone"
  on public.pack_plays for select
  to authenticated, anon
  using (true);

-- Function to increment plays_count in packs table
create or replace function increment_pack_plays()
returns trigger as $$
begin
  update public.packs
  set downloads_count = downloads_count + 1
  where id = new.pack_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-increment plays
drop trigger if exists on_pack_play on public.pack_plays;
create trigger on_pack_play
  after insert on public.pack_plays
  for each row
  execute function increment_pack_plays();
