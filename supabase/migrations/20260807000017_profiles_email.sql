-- Denormalizes email onto profiles so the app can look up/display users by
-- email (e.g. assigning a community manager/collector) without exposing
-- the auth schema itself over the API — auth.users isn't part of the
-- exposed PostgREST schema, and RLS on profiles already scopes who can see
-- whose email (self, or super_admin sees everyone).
alter table public.profiles add column email text;

create index profiles_email_idx on public.profiles (email);

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.phone,
    new.email,
    'resident'
  );
  return new;
end;
$$;

-- Keep profiles.email in sync if a user changes their auth email later.
create or replace function public.handle_auth_user_email_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_email_change();

-- Both PUBLIC (Postgres's own default on function creation) and the named
-- roles (Supabase's default privileges) need revoking — see migration
-- 20260807000020 for why revoking only one is not enough.
revoke execute on function public.handle_auth_user_email_change() from public;
revoke execute on function public.handle_auth_user_email_change() from anon, authenticated;
