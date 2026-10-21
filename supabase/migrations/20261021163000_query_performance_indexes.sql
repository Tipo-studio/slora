-- Match the indexes to the sort/filter patterns used by the application RPCs.
create index if not exists join_beta_submissions_submitted_at_idx
  on public.join_beta_submissions (submitted_at desc);

create index if not exists auth_email_events_user_created_at_idx
  on public.auth_email_events (user_id, created_at desc)
  where user_id is not null;
