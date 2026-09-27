# LEANBOX

Commercial meal-box site with **Stripe Checkout** (HKD).

Repo: https://github.com/cleanu/leanbox

## Local

```bash
npm install
cp .env.example .env.local
# paste Stripe test keys from https://dashboard.stripe.com/apikeys
npm run dev
```

Open http://localhost:3000 → **Buy with Stripe**.

## Stripe

1. Create a Stripe account (test mode first).
2. Copy `pk_test_…` and `sk_test_…`.
3. Put them in `.env.local` (never commit secrets).
4. For live sales, switch to `pk_live_` / `sk_live_` and complete Stripe business verification (HK).

Checkout is created in `app/api/checkout/route.js` (`mode: payment`, currency `hkd`).

## Deploy (Vercel)

1. Import this GitHub repo in Vercel.
2. Add env vars:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = `https://your-domain.vercel.app`
3. Redeploy.

## Menu

Edit `lib/products.js` — prices are in HKD cents (`6800` = HK$68).
