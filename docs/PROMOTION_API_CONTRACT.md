# Production Promotion API Contract

## Promotion

| Field | Value |
|---|---|
| Code | `TIPOSTUDIO` |
| Grant | 5 generation credits |
| Global limit | First 5 eligible registered users |
| Eligibility | Authenticated, non-anonymous user; one successful redemption per user |

The code, redemption count, user eligibility, and credit ledger **must be enforced by the server**. The frontend only submits the code and displays the signed-in user's server response.

## Redeem endpoint

```http
POST /api/promotions/redeem
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{
  "code": "TIPOSTUDIO"
}
```

Success response:

```json
{
  "code": "TIPOSTUDIO",
  "generationsGranted": 5,
  "creditsRemaining": 5,
  "package": null
}
```

Recommended error responses:

| Status | Message |
|---:|---|
| 401 | `Please sign in to redeem a promo code.` |
| 400 | `Promo code is invalid.` |
| 409 | `You have already redeemed this promo code.` |
| 409 | `This promo code has reached its redemption limit.` |
| 409 | `This promo code is no longer active.` |

## Server implementation requirements

1. Validate the Supabase JWT and resolve `user_id` server-side.
2. Normalize code input (`trim`, uppercase); do not trust a client-side value for grant size or limit.
3. Store promotions with `max_redemptions = 5` and grant amount `5`.
4. Use one database transaction to:
   - lock the promotion row;
   - reject exhausted or inactive promotion;
   - insert a unique redemption record using `UNIQUE (promotion_id, user_id)`;
   - increment the redemption count;
   - append a positive credit-ledger entry;
   - update the account balance.
5. Return the updated server balance. Do not return or accept client-provided balance/package values.
6. Generation-job authorization must read this same ledger and atomically reserve/decrement a credit. Never use browser storage for authorization.
7. Add audit fields: redemption ID, promotion ID, user ID, timestamp, IP/device metadata as legally appropriate.

## Example schema constraints

```sql
create table promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references promotions(id),
  user_id uuid not null references auth.users(id),
  credits_granted integer not null check (credits_granted > 0),
  created_at timestamptz not null default now(),
  unique (promotion_id, user_id)
);
```

The `promotions` row should be locked with `SELECT ... FOR UPDATE` during redemption, or redemption should use an equivalent serializable transaction / atomic stored procedure.

## Frontend behavior

- The redemption UI is available only in the authenticated account menu.
- Submit `TIPOSTUDIO` to the endpoint above.
- On success, show the returned grant and refresh entitlement data from the server.
- On an error, show the server message verbatim when safe, otherwise a generic redemption error.
- The frontend must not add credits to `localStorage` or determine whether the five-user limit has been reached.

> The existing deployed API must implement this contract before the new redemption form can complete successfully in production.
