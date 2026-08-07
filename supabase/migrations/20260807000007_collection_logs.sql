-- One row per scheduled collection run for a community.
create table public.collection_logs (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  collector_id uuid references public.profiles (id) on delete set null,
  collection_date date not null default current_date,
  status public.collection_status not null default 'completed',
  notes text,
  created_at timestamptz not null default now()
);

create index collection_logs_community_idx on public.collection_logs (community_id, collection_date);
create index collection_logs_collector_idx on public.collection_logs (collector_id);
