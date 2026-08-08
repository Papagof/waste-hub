-- A resident's `residents` row is created by staff (with profile_id null)
-- independently of when/if that person signs up for self-service access.
-- residents_select's RLS correctly does not let a signed-in resident see
-- an unclaimed row with a different profile_id, so there is no way for
-- them to link the two by themselves through normal table access — that's
-- by design, since a resident self-updating profile_id would otherwise let
-- them claim any record by guessing an id.
--
-- This RPC is the narrow, safe exception: it runs as SECURITY DEFINER, but
-- only ever claims residents rows whose email exactly matches the caller's
-- own verified profiles.email, and only when unclaimed (profile_id is
-- null). Called opportunistically when a resident visits their dashboard.
create or replace function public.claim_my_resident_records()
returns setof public.residents
language plpgsql
security definer set search_path = public
as $$
declare
  my_email text;
begin
  select email into my_email from public.profiles where id = auth.uid();
  if my_email is null then
    return;
  end if;

  return query
  update public.residents
  set profile_id = auth.uid()
  where profile_id is null and email = my_email
  returning *;
end;
$$;

-- Both PUBLIC (Postgres's own default on function creation) and the named
-- roles (Supabase's default privileges) need revoking — see migration
-- 20260807000020 for why revoking only one is not enough.
revoke execute on function public.claim_my_resident_records() from public;
revoke execute on function public.claim_my_resident_records() from anon, authenticated;
grant execute on function public.claim_my_resident_records() to authenticated;
