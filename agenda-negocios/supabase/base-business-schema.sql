create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  business_type text not null,
  phone text null,
  address text null,
  logo_url text null,
  primary_color text not null default '#19352d',
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_id_idx
  on public.businesses (owner_id);

alter table public.businesses enable row level security;

create policy "Users can view their businesses"
  on public.businesses for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = businesses.id
        and bm.user_id = auth.uid()
    )
  );

create policy "Users can insert their own businesses"
  on public.businesses for insert
  with check (owner_id = auth.uid());

create policy "Users can update their businesses"
  on public.businesses for update
  using (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = businesses.id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = businesses.id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  );

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_members_user_idx
  on public.business_members (user_id);

alter table public.business_members enable row level security;

create policy "Users can view business memberships"
  on public.business_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_members.business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  );

create policy "Owners can create memberships"
  on public.business_members for insert
  with check (
    exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_members.business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  );

create policy "Owners can update memberships"
  on public.business_members for update
  using (
    exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_members.business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  )
  with check (
    exists (
      select 1
      from public.business_members bm
      where bm.business_id = business_members.business_id
        and bm.user_id = auth.uid()
        and bm.role in ('owner', 'manager')
    )
  );

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  phone text null,
  email text null,
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists clients_business_name_idx
  on public.clients (business_id, name);

alter table public.clients enable row level security;

create policy "Members can view clients"
  on public.clients for select
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Members can create clients"
  on public.clients for insert
  with check (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Members can update clients"
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

create policy "Members can delete clients"
  on public.clients for delete
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = clients.business_id
        and business_members.user_id = auth.uid()
    )
  );
