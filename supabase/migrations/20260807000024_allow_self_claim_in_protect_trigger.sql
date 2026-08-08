-- protect_resident_self_update_columns (added to stop residents editing
-- their own status/billing_plan_id) blocks ANY non-staff change to
-- profile_id — which broke claim_my_resident_records(), the mechanism
-- that links an unclaimed residents row (profile_id null) to a newly
-- signed-up account by setting exactly that column. Found by re-testing
-- the claim flow after the earlier fix landed.
--
-- Add a narrow exception: linking an unclaimed record (old.profile_id is
-- null) to the caller's own account (new.profile_id = auth.uid()) is
-- allowed when profile_id is the only column changing — everything else
-- about the row must be untouched.
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

  if old.profile_id is null and new.profile_id = auth.uid()
    and old.community_id is not distinct from new.community_id
    and old.billing_plan_id is not distinct from new.billing_plan_id
    and old.house_unit_number is not distinct from new.house_unit_number
    and old.status is not distinct from new.status
    and old.full_name is not distinct from new.full_name
    and old.join_date is not distinct from new.join_date
    and old.virtual_account_number is not distinct from new.virtual_account_number
    and old.virtual_account_bank is not distinct from new.virtual_account_bank
  then
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
