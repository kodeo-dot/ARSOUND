-- Create followers table for user follows
create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id)
);

-- Enable RLS
alter table public.followers enable row level security;

-- RLS Policies
create policy "Followers are viewable by everyone"
  on public.followers for select
  using (true);

create policy "Users can follow others"
  on public.followers for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on public.followers for delete
  using (auth.uid() = follower_id);

-- Create indexes for faster queries
create index if not exists followers_follower_id_idx on public.followers(follower_id);
create index if not exists followers_following_id_idx on public.followers(following_id);

-- Function to update followers count
create or replace function update_followers_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.profiles
    set followers_count = followers_count + 1
    where id = NEW.following_id;
  elsif TG_OP = 'DELETE' then
    update public.profiles
    set followers_count = followers_count - 1
    where id = OLD.following_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger to automatically update followers count
drop trigger if exists on_follower_change on public.followers;
create trigger on_follower_change
  after insert or delete on public.followers
  for each row execute function update_followers_count();
