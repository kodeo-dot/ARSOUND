-- Add stats columns to profiles table
alter table public.profiles 
add column if not exists followers_count integer default 0,
add column if not exists total_sales integer default 0,
add column if not exists packs_count integer default 0;

-- Update existing profiles to have default values
update public.profiles 
set followers_count = 0, total_sales = 0, packs_count = 0
where followers_count is null or total_sales is null or packs_count is null;
