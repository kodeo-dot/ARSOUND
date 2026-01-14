-- Create packs table for sample packs
create table if not exists public.packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price integer not null, -- Price in cents (ARS)
  cover_image_url text,
  demo_audio_url text,
  file_url text, -- .zip or .rar file
  genre text,
  bpm integer,
  samples_count integer default 0,
  downloads_count integer default 0,
  likes_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.packs enable row level security;

-- RLS Policies
create policy "Packs are viewable by everyone"
  on public.packs for select
  using (true);

create policy "Users can insert their own packs"
  on public.packs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own packs"
  on public.packs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own packs"
  on public.packs for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists packs_user_id_idx on public.packs(user_id);
create index if not exists packs_genre_idx on public.packs(genre);
create index if not exists packs_created_at_idx on public.packs(created_at desc);
