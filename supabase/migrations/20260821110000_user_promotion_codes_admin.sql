-- Per-user promotion codes and an admin-managed promotion code pool.
-- Admin authorization uses auth.jwt()->'app_metadata'->>'role' = 'admin'.

create table if not exists public.user_promotion_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  promotion_id uuid not null references public.promotions(id) on delete restrict,
  code text not null,
  created_at timestamptz not null default now(),
  unique (user_id),
  unique (promotion_id)
);

create index if not exists user_promotion_codes_user_idx
  on public.user_promotion_codes (user_id);

create unique index if not exists user_promotion_codes_code_key
  on public.user_promotion_codes (upper(btrim(code)));

create table if not exists public.admin_promotion_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  generations_granted bigint not null default 20,
  max_redemptions bigint not null default 1,
  redemption_count bigint not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_promotion_codes_code_not_empty check (length(btrim(code)) > 0),
  constraint admin_promotion_codes_grant_positive check (generations_granted > 0),
  constraint admin_promotion_codes_limit_positive check (max_redemptions > 0),
  constraint admin_promotion_codes_count_valid check (redemption_count >= 0 and redemption_count <= max_redemptions),
  constraint admin_promotion_codes_window_valid check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create unique index if not exists admin_promotion_codes_code_key
  on public.admin_promotion_codes (upper(btrim(code)));

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

create or replace function public.generate_my_promotion_code()
returns table (code text, generations_granted bigint, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.user_promotion_codes%rowtype;
  v_code text;
  v_promotion_id uuid;
begin
  if v_user_id is null then
    raise exception 'PROMOTION_USER_REQUIRED' using errcode = '22023';
  end if;

  select * into v_existing from public.user_promotion_codes where user_id = v_user_id;
  if found then
    return query select v_existing.code, p.generations_granted, v_existing.created_at
      from public.promotions p where p.id = v_existing.promotion_id;
    return;
  end if;

  -- Stable user-derived prefix plus an unpredictable suffix.
  v_code := 'USER-' || upper(substr(md5(v_user_id::text), 1, 8)) || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 8));

  insert into public.promotions (code, generations_granted, max_redemptions, active)
  values (v_code, 20, 1, true)
  returning id into v_promotion_id;

  insert into public.user_promotion_codes (user_id, promotion_id, code)
  values (v_user_id, v_promotion_id, v_code);

  return query select v_code, 20::bigint, now();
exception
  when unique_violation then
    select * into v_existing from public.user_promotion_codes where user_id = v_user_id;
    if found then
      return query select v_existing.code, p.generations_granted, v_existing.created_at
        from public.promotions p where p.id = v_existing.promotion_id;
    else
      raise;
    end if;
end;
$$;

create or replace function public.admin_create_promotion_code(
  p_code text default null,
  p_generations_granted bigint default 20,
  p_max_redemptions bigint default 1,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null
)
returns public.admin_promotion_codes
language plpgsql security definer set search_path = ''
as $$
declare
  v_row public.admin_promotion_codes;
  v_code text := upper(btrim(coalesce(p_code, '')));
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if v_code = '' then v_code := 'ADMIN-' || upper(substr(md5(gen_random_uuid()::text), 1, 12)); end if;

  insert into public.admin_promotion_codes
    (code, generations_granted, max_redemptions, starts_at, ends_at, created_by)
  values (v_code, p_generations_granted, p_max_redemptions, p_starts_at, p_ends_at, auth.uid())
  returning * into v_row;

  insert into public.promotions
    (code, generations_granted, max_redemptions, starts_at, ends_at, active)
  values (v_row.code, v_row.generations_granted, v_row.max_redemptions, v_row.starts_at, v_row.ends_at, v_row.active)
  on conflict (upper(btrim(code))) do update set
    generations_granted = excluded.generations_granted,
    max_redemptions = excluded.max_redemptions,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    active = excluded.active;

  return v_row;
end;
$$;

-- A generated code is redeemable only by its owner. Admin codes remain shareable.
create or replace function public.enforce_user_promotion_code_owner()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if exists (
    select 1 from public.user_promotion_codes upc
    where upc.promotion_id = new.promotion_id and upc.user_id <> new.user_id
  ) then
    raise exception 'PROMOTION_CODE_OWNER_MISMATCH' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists promotion_redemption_owner_check on public.promotion_redemptions;
create trigger promotion_redemption_owner_check
before insert on public.promotion_redemptions
for each row execute function public.enforce_user_promotion_code_owner();

alter table public.user_promotion_codes enable row level security;
alter table public.admin_promotion_codes enable row level security;
revoke all on public.user_promotion_codes, public.admin_promotion_codes from anon, authenticated;
grant execute on function public.generate_my_promotion_code() to authenticated;
grant execute on function public.admin_create_promotion_code(text, bigint, bigint, timestamptz, timestamptz) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant all on public.user_promotion_codes, public.admin_promotion_codes to service_role;
