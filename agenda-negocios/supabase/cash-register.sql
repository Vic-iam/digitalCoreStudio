create table if not exists public.cash_register_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  entry_date date not null default current_date,
  description text not null check (char_length(trim(description)) > 0),
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'transfer', 'card')),
  client_name text,
  client_email text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.cash_register_entries add column if not exists client_name text;
alter table public.cash_register_entries add column if not exists client_email text;
alter table public.cash_register_entries add column if not exists notes text;

create index if not exists cash_register_entries_business_date_idx
  on public.cash_register_entries (business_id, entry_date, created_at desc);

alter table public.cash_register_entries enable row level security;

create policy "Members can view cash register entries"
  on public.cash_register_entries for select
  using (exists (
    select 1 from public.business_members
    where business_members.business_id = cash_register_entries.business_id
      and business_members.user_id = auth.uid()
  ));

create policy "Members can create cash register entries"
  on public.cash_register_entries for insert
  with check (exists (
    select 1 from public.business_members
    where business_members.business_id = cash_register_entries.business_id
      and business_members.user_id = auth.uid()
  ));

create policy "Members can delete cash register entries"
  on public.cash_register_entries for delete
  using (exists (
    select 1 from public.business_members
    where business_members.business_id = cash_register_entries.business_id
      and business_members.user_id = auth.uid()
  ));