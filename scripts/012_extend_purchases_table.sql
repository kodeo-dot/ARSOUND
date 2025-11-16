-- Extend purchases table with detailed information for "My Purchases" section

-- Add missing columns for purchase details
alter table public.purchases
  add column if not exists purchase_code text unique,
  add column if not exists discount_code_id uuid references public.discount_codes(id),
  add column if not exists discount_code_used text,
  add column if not exists discount_percent_applied integer default 0;

-- Create a function to generate sequential purchase codes
create or replace function generate_purchase_code()
returns text
language plpgsql
as $$
declare
  new_code text;
  code_exists boolean;
begin
  loop
    -- Generate code like "PUR-001234"
    new_code := 'PUR-' || lpad((floor(random() * 999999))::text, 6, '0');
    
    -- Check if code exists
    select exists(select 1 from public.purchases where purchase_code = new_code) into code_exists;
    
    -- Exit loop if code is unique
    exit when not code_exists;
  end loop;
  
  return new_code;
end;
$$;

-- Add trigger to auto-generate purchase codes for existing records
update public.purchases
set purchase_code = generate_purchase_code()
where purchase_code is null;

-- Add trigger for new purchases
create or replace function set_purchase_code()
returns trigger
language plpgsql
as $$
begin
  if new.purchase_code is null then
    new.purchase_code := generate_purchase_code();
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_set_purchase_code on public.purchases;
create trigger trigger_set_purchase_code
  before insert on public.purchases
  for each row
  execute function set_purchase_code();

-- Add index on purchase_code
create index if not exists idx_purchases_purchase_code on public.purchases(purchase_code);

-- Add comment
comment on column public.purchases.purchase_code is 'Unique purchase code for customer support and refunds';
comment on column public.purchases.discount_code_used is 'The actual discount code text that was used';
comment on column public.purchases.discount_percent_applied is 'The discount percentage that was applied';
