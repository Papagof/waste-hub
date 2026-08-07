-- Unified payment ledger: covers online gateway payments (Paystack,
-- Flutterwave) and manually-recorded field/cash payments in one table.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references public.residents (id) on delete restrict,
  billing_plan_id uuid not null references public.billing_plans (id) on delete restrict,
  amount_kobo bigint not null check (amount_kobo >= 0),
  amount_paid_kobo bigint not null default 0 check (amount_paid_kobo >= 0),
  currency text not null default 'NGN',
  period_start date not null,
  period_end date not null check (period_end > period_start),
  payment_date timestamptz,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  gateway public.payment_gateway not null default 'manual',
  gateway_reference text,
  receipt_number text,
  recorded_by uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gateway, gateway_reference)
);

create index payments_resident_idx on public.payments (resident_id);
create index payments_status_idx on public.payments (status);
create index payments_period_idx on public.payments (period_start, period_end);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();
