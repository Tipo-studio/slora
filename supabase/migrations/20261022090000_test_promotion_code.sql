-- Temporary QA promotion. Disable it by setting active = false; keep existing
-- redemption and credit-ledger rows intact for auditability.
insert into public.promotions (
  code,
  generations_granted,
  max_redemptions,
  active
)
values ('TEST_123', 50, 10, true)
on conflict (upper(btrim(code))) do update
set generations_granted = excluded.generations_granted,
    max_redemptions = greatest(public.promotions.redemption_count, excluded.max_redemptions),
    active = true,
    updated_at = now();
