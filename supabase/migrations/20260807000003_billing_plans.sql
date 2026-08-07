-- Billing plans define the price/cadence residents subscribe to.
-- Amounts are stored in kobo (minor units) to avoid float rounding on NGN.
create table public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cycle_type public.billing_cycle not null,
  amount_kobo bigint not null check (amount_kobo >= 0),
  currency text not null default 'NGN',
  grace_period_days integer not null default 0 check (grace_period_days >= 0),
  late_fee_kobo bigint not null default 0 check (late_fee_kobo >= 0),
  discount_percent numeric(5, 2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger billing_plans_set_updated_at
  before update on public.billing_plans
  for each row execute function public.set_updated_at();

-- Number of calendar months each cycle covers; used to compute due dates.
create or replace function public.billing_cycle_months(cycle public.billing_cycle)
returns integer
language sql
immutable
as $$
  select case cycle
    when 'monthly' then 1
    when 'bi_monthly' then 2
    when 'quarterly' then 3
    when 'half_yearly' then 6
    when 'yearly' then 12
  end;
$$;
