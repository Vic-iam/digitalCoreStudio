create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sku text,
  category text,
  stock numeric(12, 2) not null default 0 check (stock >= 0),
  minimum_stock numeric(12, 2) not null default 0 check (minimum_stock >= 0),
  unit text not null default 'unidad',
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12, 2) not null default 0 check (sale_price >= 0),
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists products_business_sku_idx
  on public.products (business_id, sku) where sku is not null;
create index if not exists products_business_name_idx on public.products (business_id, name);

alter table public.products enable row level security;

create policy "Members can view products"
  on public.products for select using (exists (
    select 1 from public.business_members
    where business_members.business_id = products.business_id and business_members.user_id = auth.uid()
  ));
create policy "Members can create products"
  on public.products for insert with check (exists (
    select 1 from public.business_members
    where business_members.business_id = products.business_id and business_members.user_id = auth.uid()
  ));
create policy "Members can update products"
  on public.products for update using (exists (
    select 1 from public.business_members
    where business_members.business_id = products.business_id and business_members.user_id = auth.uid()
  ));