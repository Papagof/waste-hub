-- Postgres grants EXECUTE to the PUBLIC pseudo-role by default when a
-- function is created — separately from Supabase's own default privilege
-- that grants directly to the named anon/authenticated/service_role roles.
-- Revoking from anon/authenticated alone (as earlier migrations did) does
-- not remove a PUBLIC-level grant, and PUBLIC is inherited by every role
-- including anon, so claim_my_resident_records and
-- handle_auth_user_email_change were still anon-callable. Revoke from
-- public explicitly too this time.
revoke execute on function public.claim_my_resident_records() from public;
revoke execute on function public.handle_auth_user_email_change() from public;

revoke execute on function public.claim_my_resident_records() from anon, authenticated;
revoke execute on function public.handle_auth_user_email_change() from anon, authenticated;

grant execute on function public.claim_my_resident_records() to authenticated;
