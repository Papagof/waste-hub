-- Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- Enums
create type public.user_role as enum (
  'super_admin',
  'community_manager',
  'field_agent',
  'resident',
  'accountant'
);

create type public.staff_role as enum (
  'manager',
  'collector'
);

create type public.billing_cycle as enum (
  'monthly',
  'bi_monthly',
  'quarterly',
  'half_yearly',
  'yearly'
);

create type public.resident_status as enum (
  'active',
  'inactive',
  'suspended'
);

create type public.payment_method as enum (
  'cash',
  'card',
  'bank_transfer',
  'mobile_money',
  'ussd'
);

create type public.payment_status as enum (
  'paid',
  'pending',
  'overdue',
  'partial',
  'failed',
  'refunded'
);

create type public.payment_gateway as enum (
  'paystack',
  'flutterwave',
  'manual'
);

create type public.collection_status as enum (
  'completed',
  'missed',
  'rescheduled'
);
