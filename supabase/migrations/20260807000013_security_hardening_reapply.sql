-- CREATE OR REPLACE FUNCTION in the rls_consolidation migration reset these
-- grants back to the PostgreSQL default (EXECUTE granted to PUBLIC).
-- Re-apply the restricted grants now that the functions are in their final
-- form. (Superseded by 20260807000014 — see that file for why this alone
-- wasn't sufficient.)
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.log_payment_change() from public;

revoke execute on function public.current_role() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.staff_community_ids(public.staff_role) from public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.staff_community_ids(public.staff_role) to authenticated;
