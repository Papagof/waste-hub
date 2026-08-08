-- payment_audit_log.payment_id was a foreign key to payments(id) on delete
-- cascade. Found via testing (deleting a payment for cleanup) that this
-- makes it impossible to log the DELETE event itself: the AFTER DELETE
-- trigger fires once the row is already gone, so inserting an audit row
-- that still references payment_id violates the FK. Worse, the cascade
-- would also silently wipe any prior audit history for that payment. The
-- audit log must be able to outlive the row it describes, so drop the FK
-- entirely; the payment_id column and its index remain for lookups.
alter table public.payment_audit_log drop constraint payment_audit_log_payment_id_fkey;
