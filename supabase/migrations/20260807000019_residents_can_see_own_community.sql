-- communities_select only granted access to staff (manager/collector/
-- accountant) and super_admin — a resident querying their own residents
-- row with an embedded communities(name) join got null back, since RLS on
-- the joined table is enforced independently of residents_self_select.
-- Found via testing the resident self-service view. A resident should be
-- able to see the name of the community they live in.
drop policy if exists communities_select on public.communities;

create policy communities_select on public.communities
  for select using (
    public.is_super_admin()
    or id in (select public.staff_community_ids('manager'))
    or id in (select public.staff_community_ids('collector'))
    or public.current_role() = 'accountant'
    or id in (select community_id from public.residents where profile_id = (select auth.uid()))
  );
