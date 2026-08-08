-- residents_update RLS only checks whether the row belongs to the caller
-- (profile_id = auth.uid()) — it says nothing about which columns they're
-- allowed to change. Confirmed via testing: a resident can currently
-- un-suspend themselves and switch their own billing_plan_id to any other
-- plan (e.g. a near-free one) via a direct table update, entirely
-- bypassing the UI, since RLS policies are row-scoped, not column-scoped.
--
-- RLS can't express "this role may update column A but not column B" —
-- that needs either column-level GRANTs (which aren't context-aware
-- enough here, since the same authenticated role must have full column
-- access when acting as staff) or a trigger. Using a trigger: staff
-- (super_admin, or the manager of the resident's community) may change
-- anything; anyone else updating their own row may only touch phone/email.
create or replace function public.protect_resident_self_update_columns()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_super_admin() then
    return new;
  end if;

  if old.community_id in (select public.staff_community_ids('manager')) then
    return new;
  end if;

  if old.community_id is distinct from new.community_id
    or old.billing_plan_id is distinct from new.billing_plan_id
    or old.house_unit_number is distinct from new.house_unit_number
    or old.status is distinct from new.status
    or old.profile_id is distinct from new.profile_id
    or old.full_name is distinct from new.full_name
    or old.join_date is distinct from new.join_date
    or old.virtual_account_number is distinct from new.virtual_account_number
    or old.virtual_account_bank is distinct from new.virtual_account_bank
  then
    raise exception 'You may only update your own phone and email.';
  end if;

  return new;
end;
$$;

create trigger residents_protect_self_update
  before update on public.residents
  for each row execute function public.protect_resident_self_update_columns();

revoke execute on function public.protect_resident_self_update_columns() from public;
revoke execute on function public.protect_resident_self_update_columns() from anon, authenticated;
