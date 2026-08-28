-- Optional audit trail for signup and email-confirmation lifecycle.
-- Supabase Auth remains the source of truth for confirmation state and tokens.

create table if not exists public.auth_email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  event_type text not null check (event_type in (
    'signup_requested',
    'confirmation_sent',
    'confirmation_resent',
    'email_confirmed',
    'signin_blocked_unconfirmed'
  )),
  source text not null default 'client' check (source in ('client', 'server', 'auth_hook')),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists auth_email_events_user_id_idx
  on public.auth_email_events(user_id);

create index if not exists auth_email_events_email_idx
  on public.auth_email_events(lower(email));

create index if not exists auth_email_events_type_created_at_idx
  on public.auth_email_events(event_type, created_at desc);

alter table public.auth_email_events enable row level security;

drop policy if exists "Users can read their own auth email events" on public.auth_email_events;
create policy "Users can read their own auth email events"
on public.auth_email_events
for select
to authenticated
using (user_id = auth.uid());

notify pgrst, 'reload schema';
