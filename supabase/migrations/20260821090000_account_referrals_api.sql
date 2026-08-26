-- Account referral API: secure RPCs consumed by the Account page.
-- Requires public.users and public.credit_grants/credit_transactions from the billing migrations.

-- This migration is intended for the Slora/Sivitai production Supabase project.
-- Apply it only after the billing schema and public.grant_credits(uuid, bigint, text, text, uuid, jsonb) exist.

alter table public.users
  add column if not exists referral_code text,
  add column if not exists referred_by_user_id uuid references public.users(id) on delete set null;

-- Ensure every existing auth account gets a referral code before the NOT NULL
-- constraint is applied. The trigger below handles future accounts.
update public.users
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

alter table public.users
  alter column referral_code set default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

alter table public.users
  alter column referral_code set not null;

create unique index if not exists users_referral_code_key on public.users(referral_code);
create index if not exists users_referred_by_user_id_idx on public.users(referred_by_user_id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete restrict,
  friend_user_id uuid not null references public.users(id) on delete cascade,
  referral_code text not null,
  bonus_generations bigint not null default 10,
  created_at timestamptz not null default now(),
  constraint referral_rewards_bonus_positive check (bonus_generations > 0),
  unique (friend_user_id),
  unique (referrer_user_id, friend_user_id)
);

create index if not exists referral_rewards_referrer_created_idx
  on public.referral_rewards(referrer_user_id, created_at desc);

create or replace function public.complete_referral(p_friend_user_id uuid, p_referral_code text)
returns table(completed boolean, referrer_user_id uuid, bonus_generations bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_referrer uuid;
  v_code text := upper(btrim(coalesce(p_referral_code, '')));
  v_bonus bigint := 10;
begin
  if p_friend_user_id is null or v_code = '' then
    return query select false, null::uuid, 0::bigint; return;
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
  -- Credit mutations must go through the existing billing grant function.
  perform public.grant_credits(v_referrer, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':referrer', null, jsonb_build_object('type','referral'));
  perform public.grant_credits(p_friend_user_id, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':friend', null, jsonb_build_object('type','referral'));
  return query select true, v_referrer, v_bonus;
end;
$$;

create or replace function public.get_my_referral_summary()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_code text; v_count bigint;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select referral_code into v_code from public.users where id = auth.uid();
  if v_code is null then raise exception 'REFERRAL_CODE_NOT_FOUND'; end if;
  select count(*) into v_count from public.referral_rewards where referrer_user_id = auth.uid();
  return jsonb_build_object('referralCode', v_code, 'successfulReferrals', v_count, 'bonusGenerations', v_count * 10);
end;
$$;

create or replace function public.get_referral_leaderboard(p_limit integer default 10)
returns table(rank bigint, account text, total_referrals bigint)
language sql security definer set search_path = public
as $$
  select row_number() over(order by count(r.id) desc, u.id),
    case when position('@' in u.email) > 2 then left(u.email, 2) || '***' || right(split_part(u.email, '@', 1), 1) || '@' || left(split_part(u.email, '@', 2), 1) || '***.' || right(split_part(u.email, '@', 2), 3) else '***' end,
    count(r.id)
  from public.users u join public.referral_rewards r on r.referrer_user_id = u.id
  group by u.id, u.email order by count(r.id) desc, u.id limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

create or replace function public.get_my_referral_history(p_limit integer default 20)
returns table(friend_account text, joined_at timestamptz, status text, reward bigint)
language sql security definer set search_path = public
as $$
  select case when position('@' in u.email) > 2 then left(u.email, 2) || '***' || right(split_part(u.email, '@', 1), 1) || '@' || left(split_part(u.email, '@', 2), 1) || '***.' || right(split_part(u.email, '@', 2), 3) else '***' end,
    r.created_at, 'successful'::text, r.bonus_generations
  from public.referral_rewards r join public.users u on u.id = r.friend_user_id
  where r.referrer_user_id = auth.uid() order by r.created_at desc limit least(greatest(coalesce(p_limit, 20), 1), 100);
$$;

revoke all on function public.complete_referral(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_referral(uuid, text) to service_role;
grant execute on function public.get_my_referral_summary() to authenticated;
grant execute on function public.get_referral_leaderboard(integer) to anon, authenticated;
grant execute on function public.get_my_referral_history(integer) to authenticated;

alter table public.referral_rewards enable row level security;
revoke all on public.referral_rewards from anon, authenticated;

-- Make newly-created RPCs visible to PostgREST immediately after migration.
notify pgrst, 'reload schema';
