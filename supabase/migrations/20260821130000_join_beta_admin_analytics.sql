-- Join Beta analytics and admin reporting.
-- Requires public.is_admin() and public.grant_credits(...).

alter table public.join_beta_submissions
  add column if not exists email_snapshot text,
  add column if not exists user_metadata jsonb not null default '{}'::jsonb,
  add column if not exists submitted_at timestamptz not null default now();

alter table public.join_beta_submissions
  drop constraint if exists join_beta_user_metadata_object;
alter table public.join_beta_submissions
  add constraint join_beta_user_metadata_object
  check (jsonb_typeof(user_metadata) = 'object');

create index if not exists join_beta_submissions_created_idx
  on public.join_beta_submissions (created_at desc);
create index if not exists join_beta_submissions_role_idx
  on public.join_beta_submissions (role);

-- Refresh the submit RPC so analytics keeps a safe email/metadata snapshot,
-- while the authoritative user_id remains the authenticated identity.
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
  v_email text;
  v_metadata jsonb;
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

  select u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb)
    into v_email, v_metadata
  from auth.users u
  where u.id = v_user_id;

  insert into public.join_beta_submissions
    (user_id, role, goals, task, example_name, email_snapshot, user_metadata, submitted_at)
  values (
    v_user_id,
    btrim(p_role),
    to_jsonb(p_goals),
    btrim(p_task),
    nullif(btrim(coalesce(p_example_name, '')), ''),
    v_email,
    v_metadata,
    now()
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

-- Admin-only aggregate analytics. Returns no task text or email addresses.
create or replace function public.admin_get_join_beta_analytics()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totalSubmissions', (select count(*) from public.join_beta_submissions),
    'totalGenerationsGranted', (select coalesce(sum(generations_granted), 0) from public.join_beta_submissions),
    'firstSubmissionAt', (select min(submitted_at) from public.join_beta_submissions),
    'lastSubmissionAt', (select max(submitted_at) from public.join_beta_submissions),
    'byRole', coalesce((
      select jsonb_agg(jsonb_build_object('role', role, 'count', total) order by total desc, role)
      from (
        select role, count(*)::bigint as total
        from public.join_beta_submissions
        group by role
      ) role_counts
    ), '[]'::jsonb),
    'byGoal', coalesce((
      select jsonb_agg(jsonb_build_object('goal', goal, 'count', total) order by total desc, goal)
      from (
        select goal, count(*)::bigint as total
        from public.join_beta_submissions s
        cross join lateral jsonb_array_elements_text(s.goals) goal
        group by goal
      ) goal_counts
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Admin-only detail export for dashboards. Task answers and email snapshots are
-- included here because the caller has explicitly passed the admin check.
create or replace function public.admin_list_join_beta_submissions(
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  email text,
  role text,
  goals jsonb,
  task text,
  example_name text,
  generations_granted bigint,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;
  if p_limit < 1 or p_limit > 500 or p_offset < 0 then
    raise exception 'ADMIN_PAGINATION_INVALID' using errcode = '22023';
  end if;

  return query
    select s.user_id, s.email_snapshot, s.role, s.goals, s.task,
      s.example_name, s.generations_granted, s.submitted_at
    from public.join_beta_submissions s
    order by s.submitted_at desc
    limit p_limit offset p_offset;
end;
$$;

revoke all on function public.admin_get_join_beta_analytics() from public, anon, authenticated;
revoke all on function public.admin_list_join_beta_submissions(integer, integer) from public, anon, authenticated;
grant execute on function public.admin_get_join_beta_analytics() to authenticated;
grant execute on function public.admin_list_join_beta_submissions(integer, integer) to authenticated;

notify pgrst, 'reload schema';
