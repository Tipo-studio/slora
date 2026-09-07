-- Fix the production Auth profile trigger.
-- The fallback must satisfy referral_code NOT NULL, and signup credits must use
-- a source accepted by the deployed grant_credits function.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.users (id, email, display_name, avatar_url, referral_code)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
      new.raw_user_meta_data ->> 'avatar_url',
      upper(substr(replace(new.id::text, '-', ''), 1, 8))
    )
    on conflict (id) do update set
      email = excluded.email,
      display_name = coalesce(excluded.display_name, public.users.display_name),
      avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
      updated_at = now();
  exception when unique_violation then
    -- A stale public.users row may still own new.email. Keep that row intact
    -- and create the new profile without the conflicting email.
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
  end;

  -- The deployed grant_credits function accepts promotion as a source.
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
