-- The original log_payment_change() compared TG_OP (always uppercase:
-- 'INSERT'/'UPDATE'/'DELETE') against lowercase literals, so old_data and
-- new_data were silently always null regardless of operation. Found via a
-- manual RLS/audit test against a throwaway user while building payment
-- recording — fixing the comparison to use the correct uppercase values.
create or replace function public.log_payment_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.payment_audit_log (payment_id, changed_by, action, old_data, new_data)
  values (
    coalesce(new.id, old.id),
    auth.uid(),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;
