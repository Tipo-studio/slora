-- Harden promotion redemption for user-owned codes and consistent API errors.
-- The existing redeem_promotion RPC remains the single credit mutation path.

create or replace function public.redeem_promotion(
  p_user_id uuid,
  p_code text
)
returns table (
  code text,
  generations_granted bigint,
  credits_remaining bigint,
  package text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_promotion public.promotions%rowtype;
  v_grant record;
  v_normalized_code text;
  v_redemption_id uuid;
begin
  if p_user_id is null then
    raise exception 'PROMOTION_USER_REQUIRED' using errcode = '22023';
  end if;

  v_normalized_code := upper(btrim(coalesce(p_code, '')));
  if v_normalized_code = '' or v_normalized_code !~ '^[A-Z0-9][A-Z0-9_-]{0,39}$' then
    raise exception 'PROMOTION_CODE_INVALID' using errcode = 'P0001';
  end if;

  select * into v_promotion
  from public.promotions
  where upper(btrim(promotions.code)) = v_normalized_code
  for update;

  if not found then
    raise exception 'PROMOTION_CODE_INVALID' using errcode = 'P0001';
  end if;

  if not v_promotion.active
     or (v_promotion.starts_at is not null and v_promotion.starts_at > now())
     or (v_promotion.ends_at is not null and v_promotion.ends_at <= now()) then
    raise exception 'PROMOTION_INACTIVE' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.user_promotion_codes upc
    where upc.promotion_id = v_promotion.id and upc.user_id <> p_user_id
  ) then
    raise exception 'PROMOTION_CODE_OWNER_MISMATCH' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.promotion_redemptions pr
    where pr.promotion_id = v_promotion.id and pr.user_id = p_user_id
  ) then
    raise exception 'PROMOTION_ALREADY_REDEEMED' using errcode = 'P0001';
  end if;

  if v_promotion.redemption_count >= v_promotion.max_redemptions then
    raise exception 'PROMOTION_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.promotion_redemptions (promotion_id, user_id, credits_granted, metadata)
  values (
    v_promotion.id,
    p_user_id,
    v_promotion.generations_granted,
    jsonb_build_object('promotionCode', v_normalized_code)
  )
  returning id into v_redemption_id;

  update public.promotions
  set redemption_count = redemption_count + 1
  where id = v_promotion.id;

  select * into v_grant
  from public.grant_credits(
    p_user_id,
    v_promotion.generations_granted,
    'promotion',
    'promotion:' || v_promotion.id::text || ':user:' || p_user_id::text,
    null,
    jsonb_build_object(
      'promotionId', v_promotion.id,
      'promotionCode', v_normalized_code,
      'redemptionId', v_redemption_id
    )
  );

  return query select
    v_normalized_code,
    v_promotion.generations_granted,
    v_grant.balance::bigint,
    null::text;
end;
$$;

revoke all on function public.redeem_promotion(uuid, text) from public, anon, authenticated;
grant execute on function public.redeem_promotion(uuid, text) to service_role;

notify pgrst, 'reload schema';
