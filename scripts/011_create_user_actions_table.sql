-- Create user_actions table to track unique actions per user
-- This prevents duplicate plays, downloads, purchases, and likes per user

create table if not exists public.user_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  pack_id uuid references public.packs(id) on delete cascade,
  action_type text not null check (action_type in ('play', 'download', 'purchase', 'like')),
  created_at timestamp with time zone default now(),
  -- Ensure one action per user per pack per type
  unique(user_id, pack_id, action_type)
);

-- Add RLS policies
alter table public.user_actions enable row level security;

-- Users can view their own actions
create policy "Users can view their own actions"
  on public.user_actions for select
  using (auth.uid() = user_id);

-- Anyone can insert actions (we'll check for duplicates in code)
create policy "Anyone can insert actions"
  on public.user_actions for insert
  with check (true);

-- Create indexes for performance
create index if not exists idx_user_actions_user_id on public.user_actions(user_id);
create index if not exists idx_user_actions_pack_id on public.user_actions(pack_id);
create index if not exists idx_user_actions_action_type on public.user_actions(action_type);
create index if not exists idx_user_actions_created_at on public.user_actions(created_at desc);

-- Add comment
comment on table public.user_actions is 'Tracks unique user actions to prevent duplicate counting';
