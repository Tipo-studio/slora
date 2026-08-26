-- Allow the authenticated friend to complete only their own referral.
-- The previous service_role-only grant could not be called from the browser SPA.
create or replace function public.complete_referral(p_friend_user_id uuid, p_referral_code text)
returns table(completed boolean, referrer_user_id uuid, bonus_generations bigint)
language plpgsql security definer set search_path = public
as $$
declare
  v_referrer uuid;
  v_code text := upper(btrim(coalesce(p_referral_code, '')));
  v_bonus bigint := 10;
begin
  if auth.uid() is null or p_friend_user_id is null or auth.uid() <> p_friend_user_id or v_code = '' then
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
  perform public.grant_credits(v_referrer, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':referrer', null, jsonb_build_object('type','referral'));
  perform public.grant_credits(p_friend_user_id, v_bonus, 'promotion', 'referral:' || p_friend_user_id::text || ':friend', null, jsonb_build_object('type','referral'));
  return query select true, v_referrer, v_bonus;
end;
$$;

revoke all on function public.complete_referral(uuid, text) from public, anon;
grant execute on function public.complete_referral(uuid, text) to authenticated, service_role;
notify pgrst, 'reload schema';
