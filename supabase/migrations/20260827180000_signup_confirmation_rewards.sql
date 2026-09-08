-- Signup is complete only after email confirmation.
-- Create the profile at Auth signup, but grant the two free generations only
-- when email_confirmed_at transitions from NULL to a timestamp.

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
    -- Keep a stale profile row intact if it still owns the email.
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

  -- Do not grant credits here: a newly inserted Auth user may still be
  -- unconfirmed and must not be treated as a completed signup.
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    -- grant_credits is idempotent for this key, so retries cannot duplicate
    -- the two signup generations.
    perform public.grant_credits(
      new.id,
      2,
      'promotion',
      'signup:' || new.id::text,
      null,
      jsonb_build_object(
        'type', 'confirmed_signup',
        'email_confirmed_at', new.email_confirmed_at
      )
    );

    insert into public.auth_email_events (user_id, email, event_type, source, metadata)
    values (
      new.id,
      new.email,
      'email_confirmed',
      'auth_hook',
      jsonb_build_object('email_confirmed_at', new.email_confirmed_at)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row execute function public.handle_auth_email_confirmed();

notify pgrst, 'reload schema';
