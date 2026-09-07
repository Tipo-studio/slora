-- Centralize referral bonus configuration.
-- Only service_role/admin-side SQL should be able to change this value.

create table if not exists public.promotion_settings (
  key text primary key,
  numeric_value bigint not null check (numeric_value >= 0),
  updated_at timestamptz not null default now()
);

insert into public.promotion_settings(key, numeric_value)
values ('referral_bonus_generations', 10)
on conflict (key) do nothing;

alter table public.promotion_settings enable row level security;
revoke all on public.promotion_settings from public, anon, authenticated;

create or replace function public.complete_referral(p_friend_user_id uuid, p_referral_code text)
returns table(completed boolean, referrer_user_id uuid, bonus_generations bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_referrer uuid;
  v_code text := upper(btrim(coalesce(p_referral_code, '')));
  v_bonus bigint;
begin
  if auth.uid() is null or p_friend_user_id is null or auth.uid() <> p_friend_user_id or v_code = '' then
    return query select false, null::uuid, 0::bigint; return;
  end if;

  select numeric_value into v_bonus
  from public.promotion_settings
  where key = 'referral_bonus_generations';

  if v_bonus is null then
    raise exception 'REFERRAL_BONUS_NOT_CONFIGURED';
  end if;

  select id into v_referrer from public.users where referral_code = v_code for update;
  if v_referrer is null or v_referrer = p_friend_user_id then
    return query select false, null::uuid, 0::bigint; return;
  end if;

  insert into public.referral_rewards(referrer_user_id, friend_user_id, referral_code, bonus_generations)
  values (v_referrer, p_friend_user_id, v_code, v_bonus)
  on conflict (friend_user_id) do nothing;
  if not found then return query select false, null::uuid, 0::bigint; return; end if;

  update public.users set referred_by_user_id = v_referrer where id = p_friend_user_id;
  perform public.grant_credits(v_referrer, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':referrer', null, jsonb_build_object('type','referral'));
  perform public.grant_credits(p_friend_user_id, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':friend', null, jsonb_build_object('type','referral'));
  return query select true, v_referrer, v_bonus;
end;
$$;

revoke all on function public.complete_referral(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_referral(uuid, text) to authenticated, service_role;

create or replace function public.get_my_referral_summary()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_count bigint;
  v_bonus bigint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select referral_code into v_code from public.get_or_create_my_referral_code();
  select count(*), coalesce(sum(bonus_generations), 0)
    into v_count, v_bonus
  from public.referral_rewards
  where referrer_user_id = auth.uid();
  return jsonb_build_object(
    'referralCode', v_code,
    'referralPath', '/signup?ref=' || v_code,
    'successfulReferrals', v_count,
    'bonusGenerations', v_bonus
  );
end;
$$;

revoke all on function public.get_my_referral_summary() from public, anon;
grant execute on function public.get_my_referral_summary() to authenticated;
notify pgrst, 'reload schema';
