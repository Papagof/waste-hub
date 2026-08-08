-- Flagged by the performance advisor after adding complaints/notification_log.
create index if not exists complaints_resolved_by_idx on public.complaints (resolved_by);
create index if not exists notification_log_sent_by_idx on public.notification_log (sent_by);
