-- Prevent a stale public.users email row from aborting Auth signup.
-- auth.users remains the source of truth; if the email is already owned by
-- another profile, keep the new profile email NULL instead of raising users_email_key.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, avatar_url, referral_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    upper(substr(replace(new.id::text, '-', ''), 1, 8))
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();

  update public.users as profile
  set email = new.email,
      updated_at = now()
  where profile.id = new.id
    and profile.email is distinct from new.email
    and not exists (
      select 1
      from public.users as existing
      where existing.email = new.email
        and existing.id <> new.id
    );

  perform public.grant_credits(
    new.id,
    2,
    'promotion',
    'signup:' || new.id::text,
    null,
    jsonb_build_object('type', 'new_account')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

notify pgrst, 'reload schema';
