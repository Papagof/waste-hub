-- Immutable audit trail for every change to a payment record, as required
-- for financial reconciliation and NDPA/NDPR compliance. payment_id is
-- deliberately NOT a foreign key: a DELETE's AFTER trigger fires once the
-- row is already gone, so a FK (especially one cascading on delete) would
-- both block logging the delete itself and let a delete wipe its own prior
-- history. The audit log is the durable record; it must outlive the row it
-- describes.
create table public.payment_audit_log (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null,
  changed_by uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz not null default now()
);

create index payment_audit_log_payment_idx on public.payment_audit_log (payment_id);

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

create trigger payments_audit
  after insert or update or delete on public.payments
  for each row execute function public.log_payment_change();
