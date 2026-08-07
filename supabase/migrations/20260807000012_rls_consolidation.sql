-- Consolidates the many role-specific permissive policies from the previous
-- migration into a single policy per (table, command). Postgres evaluates
-- every permissive policy on a table for a given command and ORs the
-- results, so N separate policies cost N evaluations per query; one policy
-- with an OR'd expression costs one. Also wraps auth.uid()/auth.role() in
-- `(select ...)` so the planner caches it as an InitPlan instead of
-- re-evaluating it per row.

-- Re-scope helper functions to use the cached-uid pattern internally too.
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid());
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
  where profile_id = (select auth.uid()) and staff_role = required_role;
$$;

-- profiles
drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;

create policy profiles_select on public.profiles
  for select using ((select auth.uid()) = id or public.is_super_admin());

create policy profiles_update on public.profiles
  for update using ((select auth.uid()) = id or public.is_super_admin())
  with check ((select auth.uid()) = id or public.is_super_admin());

create policy profiles_delete on public.profiles
  for delete using (public.is_super_admin());

-- communities
drop policy if exists communities_admin_all on public.communities;
drop policy if exists communities_staff_select on public.communities;

create policy communities_select on public.communities
  for select using (
    public.is_super_admin()
    or id in (select public.staff_community_ids('manager'))
    or id in (select public.staff_community_ids('collector'))
    or public.current_role() = 'accountant'
  );

create policy communities_insert on public.communities
  for insert with check (public.is_super_admin());

create policy communities_update on public.communities
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy communities_delete on public.communities
  for delete using (public.is_super_admin());

-- community_staff
drop policy if exists community_staff_admin_all on public.community_staff;
drop policy if exists community_staff_select_self on public.community_staff;

create policy community_staff_select on public.community_staff
  for select using (public.is_super_admin() or profile_id = (select auth.uid()));

create policy community_staff_insert on public.community_staff
  for insert with check (public.is_super_admin());

create policy community_staff_update on public.community_staff
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy community_staff_delete on public.community_staff
  for delete using (public.is_super_admin());

-- billing_plans
drop policy if exists billing_plans_select_all on public.billing_plans;
drop policy if exists billing_plans_admin_write on public.billing_plans;

create policy billing_plans_select on public.billing_plans
  for select using ((select auth.role()) = 'authenticated');

create policy billing_plans_insert on public.billing_plans
  for insert with check (public.is_super_admin());

create policy billing_plans_update on public.billing_plans
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy billing_plans_delete on public.billing_plans
  for delete using (public.is_super_admin());

-- residents
drop policy if exists residents_admin_all on public.residents;
drop policy if exists residents_manager_all on public.residents;
drop policy if exists residents_agent_select on public.residents;
drop policy if exists residents_accountant_select on public.residents;
drop policy if exists residents_self_select on public.residents;
drop policy if exists residents_self_update on public.residents;

create policy residents_select on public.residents
  for select using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
    or public.current_role() = 'accountant'
    or profile_id = (select auth.uid())
  );

create policy residents_insert on public.residents
  for insert with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  );

create policy residents_update on public.residents
  for update using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or profile_id = (select auth.uid())
  )
  with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or profile_id = (select auth.uid())
  );

create policy residents_delete on public.residents
  for delete using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  );

-- payments
drop policy if exists payments_admin_all on public.payments;
drop policy if exists payments_manager_all on public.payments;
drop policy if exists payments_agent_insert on public.payments;
drop policy if exists payments_agent_select on public.payments;
drop policy if exists payments_accountant_select on public.payments;
drop policy if exists payments_accountant_update on public.payments;
drop policy if exists payments_resident_select on public.payments;

create policy payments_select on public.payments
  for select using (
    public.is_super_admin()
    or public.current_role() = 'accountant'
    or resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
        or community_id in (select public.staff_community_ids('collector'))
        or profile_id = (select auth.uid())
    )
  );

create policy payments_insert on public.payments
  for insert with check (
    public.is_super_admin()
    or resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
        or community_id in (select public.staff_community_ids('collector'))
    )
  );

create policy payments_update on public.payments
  for update using (
    public.is_super_admin()
    or public.current_role() = 'accountant'
    or resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
    )
  )
  with check (
    public.is_super_admin()
    or public.current_role() = 'accountant'
    or resident_id in (
      select id from public.residents
      where community_id in (select public.staff_community_ids('manager'))
    )
  );

create policy payments_delete on public.payments
  for delete using (public.is_super_admin());

-- collection_logs
drop policy if exists collection_logs_admin_all on public.collection_logs;
drop policy if exists collection_logs_manager_all on public.collection_logs;
drop policy if exists collection_logs_agent_insert on public.collection_logs;
drop policy if exists collection_logs_agent_select on public.collection_logs;
drop policy if exists collection_logs_resident_select on public.collection_logs;

create policy collection_logs_select on public.collection_logs
  for select using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
    or community_id in (select community_id from public.residents where profile_id = (select auth.uid()))
  );

create policy collection_logs_insert on public.collection_logs
  for insert with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
  );

create policy collection_logs_update on public.collection_logs
  for update using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  )
  with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
  );

create policy collection_logs_delete on public.collection_logs
  for delete using (public.is_super_admin());

-- payment_audit_log (read-only; rows are only ever written by the trigger)
drop policy if exists payment_audit_log_admin_select on public.payment_audit_log;

create policy payment_audit_log_select on public.payment_audit_log
  for select using (public.is_super_admin() or public.current_role() = 'accountant');

-- Missing FK-covering indexes flagged by the performance advisor.
create index if not exists payments_recorded_by_idx on public.payments (recorded_by);
create index if not exists payments_billing_plan_idx on public.payments (billing_plan_id);
create index if not exists communities_default_billing_plan_idx on public.communities (default_billing_plan_id);
create index if not exists payment_audit_log_changed_by_idx on public.payment_audit_log (changed_by);
