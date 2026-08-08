-- community_id is always overwritten by the complaints_set_community_id
-- trigger before the row is ever checked or stored, but Supabase's
-- typegen only marks a column optional in the generated Insert type when
-- it has a real DEFAULT — a trigger-assigned value doesn't count. Giving
-- it a (semantically irrelevant, always-overwritten) default lets the
-- client omit community_id entirely, which is what we actually want:
-- nothing client-supplied should ever end up in this column.
alter table public.complaints
  alter column community_id set default '00000000-0000-0000-0000-000000000000';
