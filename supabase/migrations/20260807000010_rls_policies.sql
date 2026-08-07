-- Row Level Security: enforces the 5 roles at the database level.
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.community_staff enable row level security;
alter table public.billing_plans enable row level security;
alter table public.residents enable row level security;
alter table public.payments enable row level security;
alter table public.collection_logs enable row level security;
alter table public.payment_audit_log enable row level security;

-- Helper functions (security definer so they can read profiles/community_staff
-- without themselves being blocked by the RLS policies that call them).
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.current_role() = 'super_admin';
$$;

create or replace function public.staff_community_ids(required_role public.staff_role)
returns setof uuid
language sql
stable
security definer set search_path = public
as $$
  select community_id from public.community_staff
  where profile_id = auth.uid() and staff_role = required_role;
$$;

-- profiles: everyone can read their own profile; super_admin reads/writes all.
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid() or public.is_super_admin());

create policy profiles_admin_all on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- communities: super_admin full access; managers/collectors/accountants read
-- communities they're assigned to; accountants read all for reconciliation.
create policy communities_admin_all on public.communities
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy communities_staff_select on public.communities
  for select using (
    id in (select public.staff_community_ids('manager'))
    or id in (select public.staff_community_ids('collector'))
    or public.current_role() = 'accountant'
  );

-- community_staff: super_admin manages; staff can see their own assignments.
create policy community_staff_admin_all on public.community_staff
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy community_staff_select_self on public.community_staff
  for select using (profile_id = auth.uid());

-- billing_plans: readable by any authenticated staff/resident role; only
-- super_admin can create/edit plans.
create policy billing_plans_select_all on public.billing_plans
  for select using (auth.role() = 'authenticated');

create policy billing_plans_admin_write on public.billing_plans
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- residents: super_admin full access; community managers manage residents in
-- their assigned communities; field agents read residents in their
-- collection communities; accountants read all; a resident reads/updates
-- their own limited record.
create policy residents_admin_all on public.residents
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy residents_manager_all on public.residents
  for all using (community_id in (select public.staff_community_ids('manager')))
  with check (community_id in (select public.staff_community_ids('manager')));

create policy residents_agent_select on public.residents
  for select using (community_id in (select public.staff_community_ids('collector')));

create policy residents_accountant_select on public.residents
  for select using (public.current_role() = 'accountant');

create policy residents_self_select on public.residents
  for select using (profile_id = auth.uid());

create policy residents_self_update on public.residents
  for update using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- payments: super_admin full access; managers manage payments for residents
-- in their communities; field agents can record (insert) cash payments for
-- residents in their communities; accountants read/update (reconcile) all;
-- residents read their own payment history only.
create policy payments_admin_all on public.payments
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy payments_manager_all on public.payments
  for all using (
    resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
    )
  )
  with check (
    resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
    )
  );

create policy payments_agent_insert on public.payments
  for insert with check (
    resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('collector'))
    )
  );

create policy payments_agent_select on public.payments
  for select using (
    resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('collector'))
    )
  );

create policy payments_accountant_select on public.payments
  for select using (public.current_role() = 'accountant');

create policy payments_accountant_update on public.payments
  for update using (public.current_role() = 'accountant')
  with check (public.current_role() = 'accountant');

create policy payments_resident_select on public.payments
  for select using (
    resident_id in (select id from public.residents where profile_id = auth.uid())
  );

-- collection_logs: super_admin full access; managers manage logs for their
-- communities; field agents insert/read logs for their assigned communities.
create policy collection_logs_admin_all on public.collection_logs
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy collection_logs_manager_all on public.collection_logs
  for all using (community_id in (select public.staff_community_ids('manager')))
  with check (community_id in (select public.staff_community_ids('manager')));

create policy collection_logs_agent_insert on public.collection_logs
  for insert with check (community_id in (select public.staff_community_ids('collector')));

create policy collection_logs_agent_select on public.collection_logs
  for select using (community_id in (select public.staff_community_ids('collector')));

create policy collection_logs_resident_select on public.collection_logs
  for select using (
    community_id in (select community_id from public.residents where profile_id = auth.uid())
  );

-- payment_audit_log: read-only, super_admin and accountants only. Rows are
-- only ever written by the payments_audit trigger (security definer).
create policy payment_audit_log_admin_select on public.payment_audit_log
  for select using (public.is_super_admin() or public.current_role() = 'accountant');
