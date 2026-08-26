create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text null,
  email text null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists clients_business_name_idx
  on public.clients (business_id, name);

alter table public.clients enable row level security;

create policy "Los miembros del negocio pueden ver clientes"
  on public.clients for select
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Los miembros del negocio pueden crear clientes"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Los miembros del negocio pueden actualizar clientes"
  on public.clients for update
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Los miembros del negocio pueden borrar clientes"
  on public.clients for delete
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );
