-- Configure the active promotion used by the paywall.
-- The promotion schema and redeem_promotion RPC are deployed by the backend billing migrations.
-- This migration is intentionally idempotent for environments where the promotion already exists.

insert into public.promotions (code, generations_granted, max_redemptions, active)
values ('TIPOSTUDIO', 20, 5, true)
on conflict (upper(btrim(code))) do update
set generations_granted = excluded.generations_granted,
    active = true,
    updated_at = now();

-- Payment is disabled at the application layer. Keep the billing tables intact
-- so existing credit ledgers and historical orders remain auditable.
