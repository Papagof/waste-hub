-- Resident-filed complaints and missed-collection reports.
create type public.complaint_category as enum (
  'missed_collection',
  'billing_issue',
  'service_quality',
  'other'
);

create type public.complaint_status as enum (
  'open',
  'in_progress',
  'resolved',
  'closed'
);

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete cascade,
  -- Always derived server-side from resident_id (see the trigger below) —
  -- never trust a client-supplied community_id, or a resident could tag
  -- their own complaint with a different community_id than they actually
  -- belong to and have it show up (or fail to show up) for the wrong
  -- community's staff.
  community_id uuid not null references public.communities (id) on delete cascade,
  category public.complaint_category not null,
  description text not null,
  status public.complaint_status not null default 'open',
  resolution_notes text,
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_resident_idx on public.complaints (resident_id);
create index complaints_community_idx on public.complaints (community_id, status);

create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

create or replace function public.set_complaint_community_id()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  select community_id into new.community_id
  from public.residents
  where id = new.resident_id;

  if new.community_id is null then
    raise exception 'resident_id % does not exist', new.resident_id;
  end if;

  return new;
end;
$$;

-- BEFORE INSERT triggers run, and modify NEW, before RLS's WITH CHECK is
-- evaluated — so complaints_insert below sees the derived value, not
-- whatever (if anything) the client sent.
create trigger complaints_set_community_id
  before insert on public.complaints
  for each row execute function public.set_complaint_community_id();

revoke execute on function public.set_complaint_community_id() from public;
revoke execute on function public.set_complaint_community_id() from anon, authenticated;

alter table public.complaints enable row level security;

create policy complaints_select on public.complaints
  for select using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
    or resident_id in (select id from public.residents where profile_id = (select auth.uid()))
  );

create policy complaints_insert on public.complaints
  for insert with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or resident_id in (select id from public.residents where profile_id = (select auth.uid()))
  );

-- Only staff resolve complaints — residents can file and read their own,
-- but not edit afterward, so there's no column-scoping trap to worry about
-- here the way there was for residents_update.
create policy complaints_update on public.complaints
  for update using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  )
  with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  );

create policy complaints_delete on public.complaints
  for delete using (public.is_super_admin());
