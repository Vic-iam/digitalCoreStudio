create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  email text null,
  phone text null,
  position text not null default 'professional'
    check (position in ('owner', 'manager', 'professional', 'assistant', 'receptionist')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists professionals_business_name_idx
  on public.professionals (business_id, name);

alter table public.professionals enable row level security;

create policy "Members can view professionals"
  on public.professionals for select
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = professionals.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Members can create professionals"
  on public.professionals for insert
  with check (
    exists (
      select 1 from public.business_members
      where business_members.business_id = professionals.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Members can update professionals"
  on public.professionals for update
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = professionals.business_id
        and business_members.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.business_members
      where business_members.business_id = professionals.business_id
        and business_members.user_id = auth.uid()
    )
  );

create policy "Members can delete professionals"
  on public.professionals for delete
  using (
    exists (
      select 1 from public.business_members
      where business_members.business_id = professionals.business_id
        and business_members.user_id = auth.uid()
    )
  );
