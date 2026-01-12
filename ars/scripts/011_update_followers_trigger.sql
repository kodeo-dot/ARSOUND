-- Actualizar trigger de followers para incrementar/decrementar contador
create or replace function update_followers_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles
    set followers_count = followers_count + 1
    where id = new.following_id;
    return new;
  elsif (TG_OP = 'DELETE') then
    update public.profiles
    set followers_count = followers_count - 1
    where id = old.following_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follower_change on public.followers;
create trigger on_follower_change
  after insert or delete on public.followers
  for each row
  execute function update_followers_count();
