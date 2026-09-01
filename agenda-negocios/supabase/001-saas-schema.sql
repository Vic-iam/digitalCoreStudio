-- DigitalCore Studio / Agenda Negocios
-- Esquema base para SaaS multi-negocio.
-- IMPORTANTE: ejecutar en Supabase SQL Editor.
-- Las Edge Functions que usan service_role pueden crear negocios y usuarios.
-- Los clientes normales NO tienen permiso para crear negocios directamente.

create extension if not exists pgcrypto;

-- ============================================================
-- 1. BUSINESSES
-- ============================================================
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  business_type text not null check (char_length(trim(business_type)) > 0),
  phone text,
  address text,
  logo_url text,
  primary_color text not null default '#19352d',
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_id_idx
  on public.businesses(owner_id);

-- ============================================================
-- 2. BUSINESS MEMBERS
-- ============================================================
create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_members_business_id_idx
  on public.business_members(business_id);

create index if not exists business_members_user_id_idx
  on public.business_members(user_id);

-- ============================================================
-- 3. SECURITY FUNCTIONS
-- SECURITY DEFINER evita problemas de recursión entre políticas RLS.
-- ============================================================
create or replace function public.is_business_member(
  p_business_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = p_user_id
  )
  or exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = p_user_id
  );
$$;

create or replace function public.has_business_role(
  p_business_id uuid,
  p_roles text[],
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.businesses b
    where b.id = p_business_id
      and b.owner_id = p_user_id
  )
  or exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = p_user_id
      and bm.role = any(p_roles)
  );
$$;

-- ============================================================
-- 4. CLIENTS
-- ============================================================
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists clients_business_name_idx
  on public.clients(business_id, name);

-- ============================================================
-- 5. SERVICES
-- ============================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(12,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists services_business_name_idx
  on public.services(business_id, name);

-- ============================================================
-- 6. PRODUCTS / INVENTORY
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  sku text,
  category text,
  stock numeric(12,2) not null default 0 check (stock >= 0),
  minimum_stock numeric(12,2) not null default 0 check (minimum_stock >= 0),
  unit text not null default 'unidad',
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  description text,
  created_at timestamptz not null default now()
);

create unique index if not exists products_business_sku_idx
  on public.products(business_id, sku)
  where sku is not null;

create index if not exists products_business_name_idx
  on public.products(business_id, name);

-- ============================================================
-- 7. APPOINTMENTS
-- ============================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  employee_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  price numeric(12,2) not null default 0 check (price >= 0),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists appointments_business_start_idx
  on public.appointments(business_id, starts_at);

create index if not exists appointments_client_idx
  on public.appointments(client_id);

create index if not exists appointments_employee_idx
  on public.appointments(employee_id);

-- ============================================================
-- 8. CASH REGISTER
-- Los movimientos se crean y eliminan, pero NO se actualizan.
-- ============================================================
create table if not exists public.cash_register_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  entry_date date not null default current_date,
  description text not null check (char_length(trim(description)) > 0),
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null
    check (payment_method in ('cash', 'transfer', 'card')),
  client_name text,
  client_email text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cash_register_business_date_idx
  on public.cash_register_entries(business_id, entry_date, created_at desc);

-- ============================================================
-- 9. ENABLE RLS
-- ============================================================
alter table public.businesses enable row level security;
alter table public.business_members enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.appointments enable row level security;
alter table public.cash_register_entries enable row level security;

-- ============================================================
-- 10. BUSINESSES POLICIES
-- Solo las Edge Functions/service_role crean negocios.
-- El usuario normal solo puede ver su negocio o uno donde sea miembro.
-- Solo owner/manager pueden actualizar datos del negocio.
-- ============================================================
drop policy if exists "Users can view their businesses" on public.businesses;
drop policy if exists "Users can insert their own businesses" on public.businesses;
drop policy if exists "Users can update their businesses" on public.businesses;

create policy "Members can view businesses"
  on public.businesses
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_business_member(id)
  );

create policy "Owners and managers can update businesses"
  on public.businesses
  for update
  to authenticated
  using (public.has_business_role(id, array['owner','manager']))
  with check (public.has_business_role(id, array['owner','manager']));

-- No INSERT policy for authenticated users.
-- La creación se hace mediante create-business-account con service_role.

-- ============================================================
-- 11. BUSINESS MEMBERS POLICIES
-- Solo owner administra membresías.
-- ============================================================
drop policy if exists "Users can view business memberships" on public.business_members;
drop policy if exists "Owners can create memberships" on public.business_members;
drop policy if exists "Owners can update memberships" on public.business_members;

create policy "Members can view memberships"
  on public.business_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_business_role(business_id, array['owner'])
  );

create policy "Owners can create memberships"
  on public.business_members
  for insert
  to authenticated
  with check (public.has_business_role(business_id, array['owner']));

create policy "Owners can update memberships"
  on public.business_members
  for update
  to authenticated
  using (public.has_business_role(business_id, array['owner']))
  with check (public.has_business_role(business_id, array['owner']));

create policy "Owners can delete memberships"
  on public.business_members
  for delete
  to authenticated
  using (public.has_business_role(business_id, array['owner']));

-- ============================================================
-- 12. CLIENTS POLICIES
-- Todos los miembros pueden operar clientes.
-- ==================================================
drop policy if exists "Members can view clients" on public.clients;
drop policy if exists "Members can create clients" on public.clients;
drop policy if exists "Members can update clients" on public.clients;
drop policy if exists "Members can delete clients" on public.clients;

drop policy if exists "Los miembros del negocio pueden ver clientes" on public.clients;
drop policy if exists "Los miembros del negocio pueden crear clientes" on public.clients;
drop policy if exists "Los miembros del negocio pueden actualizar clientes" on public.clients;
drop policy if exists "Los miembros del negocio pueden borrar clientes" on public.clients;

create policy "Members can view clients"
  on public.clients for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can create clients"
  on public.clients for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "Members can update clients"
  on public.clients for update to authenticated
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "Members can delete clients"
  on public.clients for delete to authenticated
  using (public.is_business_member(business_id));

-- ============================================================
-- 13. SERVICES POLICIES
-- ============================================================
drop policy if exists "Members can view services" on public.services;
drop policy if exists "Members can create services" on public.services;
drop policy if exists "Members can update services" on public.services;
drop policy if exists "Members can delete services" on public.services;

create policy "Members can view services"
  on public.services for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can create services"
  on public.services for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','manager']));

create policy "Owners and managers can update services"
  on public.services for update to authenticated
  using (public.has_business_role(business_id, array['owner','manager']))
  with check (public.has_business_role(business_id, array['owner','manager']));

create policy "Owners and managers can delete services"
  on public.services for delete to authenticated
  using (public.has_business_role(business_id, array['owner','manager']));

-- ============================================================
-- 14. PRODUCTS POLICIES
-- ============================================================
drop policy if exists "Members can view products" on public.products;
drop policy if exists "Members can create products" on public.products;
drop policy if exists "Members can update products" on public.products;
drop policy if exists "Members can delete products" on public.products;

create policy "Members can view products"
  on public.products for select to authenticated
  using (public.is_business_member(business_id));

create policy "Owners and managers can create products"
  on public.products for insert to authenticated
  with check (public.has_business_role(business_id, array['owner','manager']));

create policy "Owners and managers can update products"
  on public.products for update to authenticated
  using (public.has_business_role(business_id, array['owner','manager']))
  with check (public.has_business_role(business_id, array['owner','manager']));

create policy "Owners and managers can delete products"
  on public.products for delete to authenticated
  using (public.has_business_role(business_id, array['owner','manager']));

-- ============================================================
-- 15. APPOINTMENTS POLICIES
-- Todos los miembros pueden ver/crear/cambiar estados.
-- ============================================================
drop policy if exists "Members can view appointments" on public.appointments;
drop policy if exists "Members can create appointments" on public.appointments;
drop policy if exists "Members can update appointments" on public.appointments;
drop policy if exists "Members can delete appointments" on public.appointments;

create policy "Members can view appointments"
  on public.appointments for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can create appointments"
  on public.appointments for insert to authenticated
  with check (
    public.is_business_member(business_id)
    and exists (
      select 1 from public.clients c
      where c.id = client_id
        and c.business_id = appointments.business_id
    )
    and exists (
      select 1 from public.services s
      where s.id = service_id
        and s.business_id = appointments.business_id
    )
    and (
      employee_id is null
      or public.is_business_member(business_id, employee_id)
    )
  );

create policy "Members can update appointments"
  on public.appointments for update to authenticated
  using (public.is_business_member(business_id))
  with check (
    public.is_business_member(business_id)
    and exists (
      select 1 from public.clients c
      where c.id = client_id
        and c.business_id = appointments.business_id
    )
    and exists (
      select 1 from public.services s
      where s.id = service_id
        and s.business_id = appointments.business_id
    )
    and (
      employee_id is null
      or public.is_business_member(business_id, employee_id)
    )
  );

create policy "Owners and managers can delete appointments"
  on public.appointments for delete to authenticated
  using (public.has_business_role(business_id, array['owner','manager']));

-- ============================================================
-- 16. CASH REGISTER POLICIES
-- Todos los miembros pueden registrar y consultar movimientos.
-- Los movimientos no se pueden modificar; owner/manager pueden borrar.
-- ============================================================
drop policy if exists "Members can view cash register entries" on public.cash_register_entries;
drop policy if exists "Members can create cash register entries" on public.cash_register_entries;
drop policy if exists "Members can delete cash register entries" on public.cash_register_entries;

create policy "Members can view cash register entries"
  on public.cash_register_entries for select to authenticated
  using (public.is_business_member(business_id));

create policy "Members can create cash register entries"
  on public.cash_register_entries for insert to authenticated
  with check (public.is_business_member(business_id));

create policy "Owners and managers can delete cash register entries"
  on public.cash_register_entries for delete to authenticated
  using (public.has_business_role(business_id, array['owner','manager']));

-- ============================================================
-- 17. GRANTS
-- RLS sigue siendo la barrera de seguridad.
-- ============================================================
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.businesses to authenticated;
grant select, insert, update, delete on public.business_members to authenticated;
grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;
grant select, insert, delete on public.cash_register_entries to authenticated;

-- ============================================================
-- 18. NOTA SOBRE REPORTES
-- Los reportes no necesitan una tabla propia inicialmente.
-- Se pueden calcular directamente desde appointments,
-- cash_register_entries, products y clients filtrando por business_id.
-- ============================================================
