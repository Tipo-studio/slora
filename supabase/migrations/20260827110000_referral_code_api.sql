-- Stable referral-code API.
-- Each account owns one immutable code, created by the auth profile trigger
-- (the referral_code column default) and persisted in public.users.

create or replace function public.get_or_create_my_referral_code()
returns table(referral_code text, referral_path text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select u.referral_code into v_code
  from public.users u
  where u.id = auth.uid()
  for update;

  -- This is a repair path for profiles created before the referral migration.
  -- It runs only when the account has no code and persists the generated value.
  if v_code is null or btrim(v_code) = '' then
    loop
      v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
      begin
        update public.users
        set referral_code = v_code, updated_at = now()
        where id = auth.uid() and referral_code is null;
        exit when found;
      exception when unique_violation then
        -- Extremely unlikely 10-character collision; generate another code.
        null;
      end;
      select referral_code into v_code from public.users where id = auth.uid();
      exit when v_code is not null;
    end loop;
  end if;

  if v_code is null then
    raise exception 'REFERRAL_CODE_NOT_FOUND';
  end if;

  return query select v_code, '/signup?ref=' || v_code;
end;
$$;

revoke all on function public.get_or_create_my_referral_code() from public, anon;
grant execute on function public.get_or_create_my_referral_code() to authenticated;

-- Keep the existing account API backed by the same persisted code.
create or replace function public.get_my_referral_summary()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_count bigint;
begin
  select referral_code into v_code from public.get_or_create_my_referral_code();
  select count(*) into v_count
  from public.referral_rewards
  where referrer_user_id = auth.uid();
  return jsonb_build_object(
    'referralCode', v_code,
    'referralPath', '/signup?ref=' || v_code,
    'successfulReferrals', v_count,
    'bonusGenerations', v_count * 10
  );
end;
$$;

revoke all on function public.get_my_referral_summary() from public, anon;
grant execute on function public.get_my_referral_summary() to authenticated;
notify pgrst, 'reload schema';
