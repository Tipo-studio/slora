-- Keep auth.users, public.users and credit_wallets synchronized.
-- This fixes Join Beta credit grants for users created before the profile trigger existed.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    insert into public.users (id, email, display_name, avatar_url)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do update set
      email = excluded.email,
      display_name = coalesce(excluded.display_name, public.users.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();
  exception when unique_violation then
    -- A stale profile can retain an email after its Auth user was deleted.
    -- Keep the new Auth signup successful and create its profile without the
    -- conflicting email; the Auth record remains the source of truth.
    insert into public.users (id, display_name, avatar_url)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url'
    )
    on conflict (id) do update set
      display_name = coalesce(excluded.display_name, public.users.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.users (id, email, display_name, avatar_url)
select au.id, au.email,
  coalesce(au.raw_user_meta_data ->> 'full_name', au.raw_user_meta_data ->> 'name'),
  au.raw_user_meta_data ->> 'avatar_url'
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
on conflict (id) do nothing;

insert into public.credit_wallets (user_id)
select pu.id
from public.users pu
left join public.credit_wallets cw on cw.user_id = pu.id
where cw.user_id is null
on conflict (user_id) do nothing;

notify pgrst, 'reload schema';
