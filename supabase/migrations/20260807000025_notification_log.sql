-- Records every reminder/alert the app has sent (or logged, if no SMS/email
-- provider is configured yet), so staff can see what's already gone out and
-- avoid re-sending the same reminder the same day.
create type public.notification_type as enum (
  'due_reminder',
  'overdue_reminder',
  'low_compliance_alert'
);

create type public.notification_channel as enum (
  'sms',
  'email',
  'log'
);

create table public.notification_log (
  id uuid primary key default gen_random_uuid(),
  notification_type public.notification_type not null,
  channel public.notification_channel not null,
  resident_id uuid references public.residents (id) on delete cascade,
  community_id uuid not null,
  message text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  sent_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index notification_log_resident_idx on public.notification_log (resident_id, notification_type, created_at);
create index notification_log_community_idx on public.notification_log (community_id, created_at);

alter table public.notification_log enable row level security;

-- Same visibility as the residents/communities these notifications are
-- about: super_admin, the community's manager or collector.
create policy notification_log_select on public.notification_log
  for select using (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
  );

create policy notification_log_insert on public.notification_log
  for insert with check (
    public.is_super_admin()
    or community_id in (select public.staff_community_ids('manager'))
    or community_id in (select public.staff_community_ids('collector'))
  );
