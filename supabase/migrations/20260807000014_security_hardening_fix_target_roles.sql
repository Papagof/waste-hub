-- Supabase's `alter default privileges` grants EXECUTE directly to the
-- anon/authenticated roles at function-creation time, not via the PUBLIC
-- pseudo-role, so `revoke ... from public` (previous migration) was a
-- no-op against anon/authenticated. Revoke from the actual role names.
revoke execute on function public.handle_new_auth_user() from anon, authenticated;
revoke execute on function public.log_payment_change() from anon, authenticated;

revoke execute on function public.current_role() from anon, authenticated;
revoke execute on function public.is_super_admin() from anon, authenticated;
revoke execute on function public.staff_community_ids(public.staff_role) from anon, authenticated;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.staff_community_ids(public.staff_role) to authenticated;
