-- Join Beta submission and one-time five-generation reward.
-- Requires public.grant_credits(uuid, bigint, text, text, uuid, jsonb).

create table if not exists public.join_beta_submissions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null,
  goals jsonb not null default '[]'::jsonb,
  task text not null,
  example_name text,
  generations_granted bigint not null default 5,
  created_at timestamptz not null default now(),
  constraint join_beta_role_not_empty check (length(btrim(role)) > 0),
  constraint join_beta_task_not_empty check (length(btrim(task)) > 0),
  constraint join_beta_goals_array check (jsonb_typeof(goals) = 'array'),
  constraint join_beta_grant_fixed check (generations_granted = 5)
);

alter table public.join_beta_submissions enable row level security;
revoke all on public.join_beta_submissions from anon, authenticated;
grant all on public.join_beta_submissions to service_role;

create or replace function public.submit_join_beta(
  p_role text,
  p_goals text[],
  p_task text,
  p_example_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.join_beta_submissions%rowtype;
  v_grant record;
  v_balance bigint;
begin
  if v_user_id is null then
    raise exception 'JOIN_BETA_LOGIN_REQUIRED' using errcode = '22023';
  end if;
  if length(btrim(coalesce(p_role, ''))) = 0
     or coalesce(array_length(p_goals, 1), 0) = 0
     or length(btrim(coalesce(p_task, ''))) = 0 then
    raise exception 'JOIN_BETA_REQUIRED_FIELDS' using errcode = '22023';
  end if;

  select * into v_existing
  from public.join_beta_submissions
  where user_id = v_user_id
  for update;

  if found then
    select coalesce(balance, 0) into v_balance
    from public.credit_wallets
    where user_id = v_user_id;
    return jsonb_build_object(
      'generationsGranted', 0,
      'creditsRemaining', coalesce(v_balance, 0),
      'alreadySubmitted', true
    );
  end if;

  insert into public.join_beta_submissions (user_id, role, goals, task, example_name)
  values (
    v_user_id,
    btrim(p_role),
    to_jsonb(p_goals),
    btrim(p_task),
    nullif(btrim(coalesce(p_example_name, '')), '')
  );

  select * into v_grant
  from public.grant_credits(
    v_user_id,
    5,
    'promotion',
    'join-beta:' || v_user_id::text,
    null,
    jsonb_build_object('type', 'join_beta', 'role', btrim(p_role))
  );

  return jsonb_build_object(
    'generationsGranted', 5,
    'creditsRemaining', v_grant.balance,
    'alreadySubmitted', false
  );
end;
$$;

revoke all on function public.submit_join_beta(text, text[], text, text) from public, anon;
grant execute on function public.submit_join_beta(text, text[], text, text) to authenticated;

comment on function public.submit_join_beta(text, text[], text, text) is
  'Stores one beta submission per user and atomically grants exactly five generations once.';

notify pgrst, 'reload schema';
