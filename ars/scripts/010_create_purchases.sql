-- Crear tabla para registrar compras y calcular ventas
create table if not exists public.purchases (
  id uuid default gen_random_uuid() primary key,
  pack_id uuid references public.packs(id) on delete cascade not null,
  buyer_id uuid references auth.users(id) on delete set null not null,
  seller_id uuid references auth.users(id) on delete set null not null,
  amount_paid integer not null,
  commission integer not null,
  seller_earnings integer not null,
  discount_code_id uuid references public.discount_codes(id) on delete set null,
  purchased_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists purchases_pack_id_idx on public.purchases(pack_id);
create index if not exists purchases_buyer_id_idx on public.purchases(buyer_id);
create index if not exists purchases_seller_id_idx on public.purchases(seller_id);
create index if not exists purchases_purchased_at_idx on public.purchases(purchased_at desc);

-- RLS policies
alter table public.purchases enable row level security;

create policy "Users can view their own purchases"
  on public.purchases for select
  to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Users can insert purchases"
  on public.purchases for insert
  to authenticated
  with check (buyer_id = auth.uid());

-- Function to update seller stats after purchase
create or replace function update_seller_stats_on_purchase()
returns trigger as $$
begin
  -- Update seller's total sales
  update public.profiles
  set total_sales = total_sales + new.seller_earnings
  where id = new.seller_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-update stats
drop trigger if exists on_purchase_created on public.purchases;
create trigger on_purchase_created
  after insert on public.purchases
  for each row
  execute function update_seller_stats_on_purchase();
