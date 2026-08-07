-- Per-resident billing status: next due date and compliance, computed live
-- from the payment ledger rather than stored/duplicated on residents.
create view public.resident_payment_status
with (security_invoker = true)
as
select
  r.id as resident_id,
  r.community_id,
  r.full_name,
  r.status as resident_status,
  bp.id as billing_plan_id,
  bp.cycle_type,
  bp.amount_kobo,
  bp.grace_period_days,
  lp.last_paid_period_end,
  coalesce(lp.last_paid_period_end + 1, r.join_date) as next_due_date,
  coalesce(lp.last_paid_period_end + 1, r.join_date) + bp.grace_period_days as grace_deadline,
  case
    when r.status <> 'active' then r.status::text
    when current_date <= coalesce(lp.last_paid_period_end + 1, r.join_date) then 'current'
    when current_date <= coalesce(lp.last_paid_period_end + 1, r.join_date) + bp.grace_period_days then 'grace_period'
    else 'overdue'
  end as compliance_status
from public.residents r
join public.billing_plans bp on bp.id = r.billing_plan_id
left join lateral (
  select max(p.period_end) as last_paid_period_end
  from public.payments p
  where p.resident_id = r.id and p.status = 'paid'
) lp on true;

-- Community-level rollup for the admin/manager dashboard.
-- Resident counts and revenue are aggregated independently (each by
-- community_id) before joining, so one community having many payments
-- doesn't fan out and inflate its resident counts.
create view public.community_payment_summary
with (security_invoker = true)
as
with resident_stats as (
  select
    community_id,
    count(*) as total_residents,
    count(*) filter (where resident_status = 'active') as active_residents,
    count(*) filter (where compliance_status = 'overdue') as overdue_residents,
    count(*) filter (where compliance_status = 'grace_period') as grace_period_residents
  from public.resident_payment_status
  group by community_id
),
revenue_stats as (
  select
    r.community_id,
    coalesce(sum(p.amount_paid_kobo) filter (
      where p.status = 'paid' and p.payment_date >= date_trunc('month', current_date)
    ), 0) as revenue_this_month_kobo
  from public.residents r
  left join public.payments p on p.resident_id = r.id
  group by r.community_id
)
select
  c.id as community_id,
  c.name as community_name,
  coalesce(rs.total_residents, 0) as total_residents,
  coalesce(rs.active_residents, 0) as active_residents,
  coalesce(rs.overdue_residents, 0) as overdue_residents,
  coalesce(rs.grace_period_residents, 0) as grace_period_residents,
  coalesce(rv.revenue_this_month_kobo, 0) as revenue_this_month_kobo
from public.communities c
left join resident_stats rs on rs.community_id = c.id
left join revenue_stats rv on rv.community_id = c.id;
