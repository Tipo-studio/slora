-- Give every newly-created account exactly two free generations.
-- The grant is idempotent so retries or profile-sync migrations cannot duplicate it.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
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

  -- grant_credits uses the idempotency key to ensure this runs once per Auth user.
  perform public.grant_credits(
    new.id,
    2,
    'signup',
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