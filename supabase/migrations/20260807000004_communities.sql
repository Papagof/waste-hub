-- Communities/estates.
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  zone text,
  collection_days text[] not null default '{}',
  default_billing_plan_id uuid references public.billing_plans (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger communities_set_updated_at
  before update on public.communities
  for each row execute function public.set_updated_at();

-- Staff assignments: which manager(s)/collector(s) serve which community.
-- A person can be assigned to more than one community, and a community can
-- have more than one collector.
create table public.community_staff (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  staff_role public.staff_role not null,
  created_at timestamptz not null default now(),
  unique (community_id, profile_id, staff_role)
);

create index community_staff_profile_idx on public.community_staff (profile_id);
create index community_staff_community_idx on public.community_staff (community_id);
