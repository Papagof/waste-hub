-- Residents/households. profile_id is nullable: a resident exists as a
-- billing record from day one, and is only linked to an auth user once
-- they activate self-service portal access.
create table public.residents (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete restrict,
  profile_id uuid unique references public.profiles (id) on delete set null,
  billing_plan_id uuid not null references public.billing_plans (id) on delete restrict,
  full_name text not null,
  phone text,
  email text,
  house_unit_number text not null,
  status public.resident_status not null default 'active',
  virtual_account_number text,
  virtual_account_bank text,
  join_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community_id, house_unit_number)
);

create index residents_community_idx on public.residents (community_id);
create index residents_status_idx on public.residents (status);
create index residents_billing_plan_idx on public.residents (billing_plan_id);

create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function public.set_updated_at();
