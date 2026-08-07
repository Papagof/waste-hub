-- Pin search_path on SECURITY DEFINER / trigger helper functions so they
-- can't be tricked by a session-local search_path into resolving objects
-- from an unexpected schema.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.billing_cycle_months(cycle public.billing_cycle)
returns integer
language sql
immutable
set search_path = public
as $$
  select case cycle
    when 'monthly' then 1
    when 'bi_monthly' then 2
    when 'quarterly' then 3
    when 'half_yearly' then 6
    when 'yearly' then 12
  end;
$$;

-- Trigger-only functions: never meant to be called directly over the API.
revoke execute on function public.handle_new_auth_user() from public;
revoke execute on function public.log_payment_change() from public;

-- RLS helper functions: only needed inside policy expressions evaluated for
-- signed-in users, so drop anon's ability to call them directly via RPC.
revoke execute on function public.current_role() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.staff_community_ids(public.staff_role) from public;

grant execute on function public.current_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.staff_community_ids(public.staff_role) to authenticated;
