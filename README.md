# LeanBox — 吃得健康，活得健康

Chef-prepped nutrition meals for Hong Kong: an editorial marketing site running on real auth, a real cart, Stripe Checkout (one-off boxes and weekly subscriptions), customer accounts, and an admin panel with profit reporting.

- **UI language:** Traditional Chinese, Hong Kong (`zh-HK`, default) with an English toggle in the header
- **Currency:** HKD · **Delivery:** HK Island / Kowloon / New Territories (18 districts) · **Cutoff:** Sunday 23:59 HKT (configurable)

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router, Turbopack, `proxy.ts`), React 19, TypeScript, Tailwind CSS v4 |
| Auth / DB / files | Supabase: Auth (email + password, Google, Apple), Postgres with RLS, Storage (`meal-images`) |
| Payments | Stripe Checkout (`payment` + `subscription`), Customer Portal, signed webhooks |
| i18n | `next-intl` (cookie-based locale, no URL prefix); strings in `messages/zh-HK.ts` and `messages/en.ts` |
| Validation | zod v4 on every server action and route handler |
| Motion | Lenis smooth scroll, GSAP ScrollTrigger, Framer Motion, magnetic CTAs; all honour `prefers-reduced-motion` |
| Charts | Recharts (admin), palette validated for colour-vision deficiency |
| Fonts | Self-hosted via Fontsource: Noto Serif TC and Noto Sans TC (CJK, unicode-range sliced), Fraunces; plus Geist. The build makes no call to Google Fonts. |

> **Runs without keys.** With no `.env.local`, the marketing site, menu and guest cart work on seed data. Auth, checkout, account and admin show a styled setup screen instead of crashing, and `/setup` lists which variables are missing.

---

## Contents

1. [Quick start](#1-quick-start)
2. [File tree](#2-file-tree)
3. [Supabase: project, migrations, seed](#3-supabase-project-migrations-seed)
4. [Supabase Auth: URLs, email, Google, Apple](#4-supabase-auth)
5. [Stripe: HKD, plans, webhook, portal](#5-stripe)
6. [Create the first admin](#6-create-the-first-admin)
7. [How the flows work](#7-how-the-flows-work)
8. [Business rules & configuration](#8-business-rules--configuration)
9. [Security model](#9-security-model)
10. [Deploying (Vercel)](#10-deploying-vercel)
11. [Assets, scripts & testing](#11-assets-scripts--testing)
12. [Known limitations / TODO](#12-known-limitations--todo)

---

## 1. Quick start

```bash
npm install
cp .env.example .env.local      # optional — the site runs in demo mode without it
npm run dev                     # http://localhost:3000
```

Requires Node.js ≥ 20.9. Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm test` | Unit tests (weeks/cutoff, money, validation, profit maths) |
| `npm run db:check` | Applies all migrations + seed to an in-memory Postgres (PGlite) and runs 28 RLS / fulfilment checks. No Docker needed. |
| `npm run seed:generate` | Regenerates `supabase/seed.sql` and the demo catalog from `supabase/seed-data.mjs` |
| `npm run stripe:listen` | Forwards Stripe test events to your local webhook |
| `npm run apple:secret -- …` | Generates the Apple client-secret JWT (see §4.4) |

---

## 2. File tree

```
leanbox/
├─ proxy.ts                          # Next 16 "middleware": refresh Supabase session, guard /account
├─ next.config.ts                    # next-intl plugin, image hosts, security headers
├─ .env.example                      # every variable, documented
├─ i18n/request.ts                   # locale from NEXT_LOCALE cookie (default zh-HK)
├─ messages/
│  ├─ zh-HK.ts                       # 香港繁體中文 (source of truth for keys)
│  └─ en.ts                          # English (type-checked against zh-HK)
├─ supabase/
│  ├─ migrations/
│  │  ├─ 20260928000100_schema.sql   # tables, indexes, updated_at triggers
│  │  ├─ 20260928000200_functions.sql# auth.users → profiles trigger, is_admin(), role guard, fulfill_order()
│  │  ├─ 20260928000300_rls.sql      # RLS on every table + column privileges (cost hidden)
│  │  └─ 20260928000400_storage.sql  # meal-images bucket + admin-only write policies
│  ├─ seed.sql                       # 9 meals + 3 plans (generated)
│  └─ seed-data.mjs                  # catalog source of truth
├─ app/
│  ├─ layout.tsx                     # fonts, <html lang>, NextIntl + toast providers
│  ├─ (site)/                        # header + footer + cart drawer + smooth scroll
│  │  ├─ page.tsx                    # home: hero, how it works, featured meals, numbers, plans, founder, FAQ
│  │  ├─ menu/page.tsx               # filters, sort, meal slide-over (?meal=slug)
│  │  ├─ plans/page.tsx  about/page.tsx
│  │  ├─ checkout/page.tsx           # login wall → delivery form → week → Stripe
│  │  └─ account/                    # profile, orders, order detail + timeline, plan (portal)
│  ├─ (auth)/                        # split-screen auth shell
│  │  ├─ login/ signup/ forgot-password/ reset-password/
│  ├─ auth/callback/route.ts         # OAuth + email links (code / token_hash / errors)
│  ├─ auth/signout/route.ts          # POST sign-out
│  ├─ api/stripe/webhook/route.ts    # raw-body signature check, idempotent handlers
│  ├─ admin/                         # 404 unless profiles.role = 'admin'
│  │  ├─ page.tsx                    # KPIs (today/week/month), revenue chart, status mix
│  │  ├─ orders/ (list, [id], export/route.ts → CSV)
│  │  ├─ meals/ (list, new, [id])    # CRUD, price/COGS, stock, photos → Storage
│  │  ├─ plans/ customers/ finance/
│  └─ setup/page.tsx                 # env checklist
├─ actions/                          # server actions (zod-validated)
│  ├─ auth.ts cart.ts checkout.ts account.ts locale.ts
│  └─ admin/ orders.ts meals.ts plans.ts
├─ components/
│  ├─ site/ home/ menu/ plans/ cart/ checkout/ auth/ account/ admin/ motion/ ui/ setup/
├─ lib/
│  ├─ supabase/ server.ts client.ts admin.ts proxy.ts database.types.ts
│  ├─ auth/ session.ts providers.ts errors.ts recovery.ts
│  ├─ catalog/ cart/ orders/ stripe/ admin/
│  ├─ config.ts                      # delivery fee, cutoff, fee estimate, contact
│  ├─ weeks.ts districts.ts tags.ts money.ts validation.ts rate-limit.ts env.ts env.server.ts
├─ public/
│  ├─ brand/logo.svg mark.svg providers/   # logo slot + official Apple/Google marks go here
│  ├─ food/*.jpg                     # meal photo slots (placeholders included)
│  └─ about/founder.jpg              # founder photo slot (placeholder included)
├─ scripts/                          # seed generator, db checks, Apple secret, placeholder art
└─ tests/                            # vitest unit tests
```

---

## 3. Supabase: project, migrations, seed

1. **Create a project.** In [supabase.com/dashboard](https://supabase.com/dashboard), click **New project**. Pick the **Southeast Asia (Singapore)** region (closest to HK), set a strong DB password, then **Create**.
2. **Copy the keys** from **Project Settings → API Keys** (and **Data API** for the URL) into `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` is the Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the `anon` key (legacy) or a `sb_publishable_…` key.
   - `SUPABASE_SERVICE_ROLE_KEY` is the `service_role` key (legacy) or a `sb_secret_…` key. **Server only.**
3. **Run the migrations.** Pick one:
   - **SQL Editor:** open **SQL Editor → New query**, paste each file from `supabase/migrations/` **in filename order**, and click **Run** for each.
   - **CLI:** `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push`.
4. **Seed:** paste and run `supabase/seed.sql` in the SQL Editor (safe to re-run; it upserts by id).
5. **Check:** **Table Editor** should show 9 meals and 3 plans. **Storage** should show a public `meal-images` bucket.

Types live in `lib/supabase/database.types.ts`. After schema changes, regenerate them with
`npx supabase gen types typescript --project-id <ref> --schema public > lib/supabase/database.types.ts`.

---

## 4. Supabase Auth

### 4.1 URL configuration

**Authentication → URL Configuration**

| Field | Value |
| --- | --- |
| Site URL | your `NEXT_PUBLIC_SITE_URL`, e.g. `http://localhost:3000` (later `https://leanbox.hk`) |
| Redirect URLs | `http://localhost:3000/auth/callback`<br>`https://leanbox.hk/auth/callback`<br>(Vercel previews: `https://*-<team>.vercel.app/auth/callback`) |

Every redirect back from Supabase lands on `/auth/callback`, which exchanges the code for a session and then forwards to `?next=` (same-site paths only).

### 4.2 Email + password

**Authentication → Sign In / Providers → Email**
- **Enable Email provider:** on
- **Confirm email:** on (the signup page then shows 「請查收驗證郵件」 with a resend button)
- **Minimum password length:** 8 (the app enforces 8 as well)

**Email templates** (**Authentication → Emails → Templates**). The default `{{ .ConfirmationURL }}` links work, but only in the browser that started the flow (PKCE). To make links work on any device, change the link in each template to the `token_hash` form:

| Template | Link |
| --- | --- |
| Confirm signup | `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/account` |
| Reset password | `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password` |
| Change email address | `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email_change&next=/account` |

Suggested zh-HK subjects: 「確認你的 LeanBox 帳戶」 / 「重設你的 LeanBox 密碼」 / 「確認新電郵地址」.

**Production:** set up **custom SMTP** under **Authentication → Emails → SMTP Settings**, for example Resend or Postmark. Supabase's built-in sender is heavily rate-limited and meant for testing only.

**Rate limits:** **Authentication → Rate Limits** protects the auth endpoints. The app also applies a basic per-IP throttle to login, signup, resend and forgot-password (`lib/rate-limit.ts`). That throttle is in-memory, so on multi-instance hosting swap it for Upstash Ratelimit.

The forgot-password page always shows 「我們已寄出重設密碼郵件（如該電郵已註冊）」, whether or not the email exists, to avoid account enumeration. `/reset-password` only accepts a **recovery session**: `/auth/callback` sets a 15-minute httpOnly marker when the link type is `recovery`. Expired or used links show 「連結已失效」 with a button back to the forgot-password page.

### 4.3 Google

1. In [Google Cloud Console](https://console.cloud.google.com/), **create a project** (or pick one).
2. **APIs & Services → OAuth consent screen:**
   - User type **External**, app name **LeanBox**, support email.
   - Authorised domains: `supabase.co` and your domain.
   - Scopes: `openid`, `email`, `profile`.
   - **Publish** the app when you go live.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Application type: **Web application**
   - Authorised JavaScript origins: `http://localhost:3000`, `https://leanbox.hk`
   - Authorised redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy the **Client ID** and **Client secret** to Supabase: **Authentication → Sign In / Providers → Google** → enable → paste → **Save**.

### 4.4 Apple (Sign in with Apple)

You need a paid Apple Developer account.

1. Go to [developer.apple.com/account](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles**.
2. **Identifiers → + → App IDs** (e.g. `hk.leanbox.app`). Enable **Sign in with Apple**.
3. **Identifiers → + → Services IDs** (e.g. `hk.leanbox.web`). This is the web client ID.
   - Enable **Sign in with Apple** → **Configure**:
     - Primary App ID: the one above
     - Domains: `<project-ref>.supabase.co`
     - Return URLs: `https://<project-ref>.supabase.co/auth/v1/callback`
4. **Keys → +**, enable **Sign in with Apple**, then download the `.p8` file (you can only download it once). Note the **Key ID**. Your **Team ID** is at the top right of the portal.
5. Generate the client-secret JWT. It is valid for up to 6 months, so **set a reminder to regenerate it**:
   ```bash
   npm run apple:secret -- --team ABCDE12345 --key-id XYZ987ABCD --services-id hk.leanbox.web --p8 ./AuthKey_XYZ987ABCD.p8
   ```
6. In Supabase, go to **Authentication → Sign In / Providers → Apple** and enable it:
   - Client IDs: `hk.leanbox.web`
   - Secret Key: the JWT from step 5
   - **Save**

**Apple specifics handled by the app**
- Apple shares the user's email (possibly a `@privaterelay.appleid.com` relay) and name **only on the first consent**. The profile trigger stores the Apple `sub` in `profiles.apple_user_id`, and sign-in also syncs it from `user.identities`.
- If a user has no email, or only a relay address, **/account** shows a card to add a contact email and to change the sign-in email. The change goes through `supabase.auth.updateUser({ email })`, which requires confirmation.

### 4.5 Hidden provider buttons

The login and signup pages read `GET {SUPABASE_URL}/auth/v1/settings` (cached for 5 minutes) and **only render Google or Apple buttons for providers that are enabled**. Nothing fakes a successful sign-in. To force the buttons on or off, set `AUTH_PROVIDERS=google,apple` or `none`.

Official button artwork: Apple and Google require their unmodified marks. They live in `public/brand/providers/` as `apple.svg` and `google.png`; that folder's README says where each came from. If a file is missing, the button renders text-only, styled to its brand's button guidelines.

### 4.6 Account linking (Google ↔ email ↔ Apple)

- **Automatic (safe default):** Supabase links identities that share the **same verified email** into one user. Someone who signs up with email and later uses Google with that address lands in the same account.
- **It won't link** when either email is unverified. A relay address from Apple also won't match, so that person gets a separate account.
- **Manual linking:** **/account → 登入方式** has a 連結 button that calls `supabase.auth.linkIdentity()`. For it to work, enable **Authentication → Sign In / Providers → "Allow manual linking"**. Otherwise the UI shows a clear message. Merging two *existing* accounts is deliberately not automated. Do it by hand in the dashboard after verifying ownership.

---

## 5. Stripe

1. **Account:** create or activate a Stripe account with country **Hong Kong** (settlement in HKD). Use **Test mode** while developing.
2. **Keys:** under **Developers → API keys**, copy the keys to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY`.
3. **Payment methods:** **Settings → Payment methods** controls what Checkout offers: cards, Apple Pay and Google Pay (automatic with cards), Alipay HK, WeChat Pay and so on. The code doesn't hard-code `payment_method_types`.
4. **Products & prices for weekly plans.** For each plan, go to **Product catalog → + Add product**:
   - Name: e.g. `LeanBox 均衡計劃 Balance (10 meals/week)`
   - Price: **Recurring**, **HKD**, amount per week (e.g. 820.00), **Billing period: Weekly**
   - Save and copy the **Price ID** (`price_…`)
5. **Map the Price IDs.** Either use **/admin/plans → Stripe Price ID**, or run SQL:
   ```sql
   update public.plans set stripe_price_id = 'price_…' where slug = 'starter-5';
   update public.plans set stripe_price_id = 'price_…' where slug = 'balance-10';
   update public.plans set stripe_price_id = 'price_…' where slug = 'performance-14';
   ```
   *Dev fallback:* if a plan has no Price ID, checkout sends `price_data` with a weekly recurrence so you can test right away. Map real prices before going live; the Customer Portal and reporting work best with catalog prices.
6. **Customer Portal:** go to **Settings → Billing → Customer portal** and click **Save** once (in test mode too). Allow cancelling subscriptions and updating payment methods. `/account/plan → 管理訂閱及付款方式` opens it.
7. **Webhook (production):** **Developers → Webhooks → + Add endpoint**:
   - URL: `https://leanbox.hk/api/stripe/webhook`
   - Events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.expired`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `invoice.paid`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Signing secret** into `STRIPE_WEBHOOK_SECRET`.
8. **Webhook (local):** install the [Stripe CLI](https://docs.stripe.com/stripe-cli), then:
   ```bash
   stripe login
   npm run stripe:listen
   # = stripe listen --forward-to localhost:3000/api/stripe/webhook --events …
   ```
   Put the printed `whsec_…` into `.env.local` and restart `npm run dev`.

   Even without `stripe listen`, returning to `/account/orders?success=1&session_id=…` confirms the session with Stripe and fulfils the order. This is idempotent with the webhook.

**Test cards** (any future expiry, any CVC, any postcode):

| Card | Result |
| --- | --- |
| `4242 4242 4242 4242` | Succeeds |
| `4000 0025 0000 3155` | Requires 3-D Secure authentication |
| `4000 0000 0000 9995` | Declined (insufficient funds) → order stays 待付款 with `payment_error` |
| `4000 0000 0000 0341` | Attaches, then fails on a later charge (subscription renewal failure) |

Refund a test payment from **/admin/orders/[id] → 退款** or from the Stripe Dashboard. Either way, the `charge.refunded` event flips the order to 已退款.

---

## 6. Create the first admin

Option A, using the env var:
1. Put your email in `ADMIN_EMAILS` (comma-separated for several) and restart.
2. Sign up and verify the email, or sign in with Google.
3. On sign-in, the server promotes verified emails on that list to `role = 'admin'` and records it in `admin_audit`.

Option B, using SQL: sign up normally, then run this in the SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Then open **/admin**. Anyone who isn't an admin, including signed-out visitors, gets a normal **404**, so the admin area doesn't reveal that it exists.

---

## 7. How the flows work

**Guest → cart → login → merge.**
- Guests can browse and add to the cart. The guest cart lives in `localStorage` (`leanbox.cart.v1`).
- After sign-in by any method, `CartProvider` calls `mergeGuestCart()`, which adds the quantities into the user's `carts` / `cart_items` rows (RLS owner-only), clamps them to stock, and clears the local copy.
- Signing out drops the account cart from view; the guest cart starts empty.

**Checkout** (`/checkout`, or `/checkout?plan=<id>` for a subscription):
1. **Login wall:** guests see their summary plus login and signup CTAs that come back to checkout.
2. **Delivery form:** 姓名、電話 (+852, validated to 8 digits)、區域 → 分區、地址、送遞備註. Optionally saved as the profile default.
3. **Week:** 本週批次 or 下週批次, showing the delivery dates and cutoff.
4. **Summary**, then **使用 Stripe 付款**.

`startCheckout()` then:
- re-reads prices, stock and COGS **from the DB** (never from the client);
- expires any earlier unpaid session;
- inserts `orders` (`pending_payment`) and `order_items` (with name, price and cost snapshots);
- creates or reuses the Stripe Customer (email from the account);
- creates the Checkout Session with `mode: payment | subscription`, `locale: zh-HK`, HKD, `metadata {order_id, user_id, cart_id, plan_id, fulfillment_week}`, `success_url /account/orders?success=1&session_id={CHECKOUT_SESSION_ID}` and `cancel_url /checkout`.

We collect the HK address in-app, so Checkout doesn't ask for it again.

**Payment confirmed** (webhook or success page): the `fulfill_order()` SQL function runs atomically and only transitions `pending_payment → paid`. It then:
- sets `paid_at` and the payment IDs;
- decrements `weekly_stock` (never below 0);
- removes the purchased lines from the cart and closes it if it's empty.

Running it twice is a no-op. Webhook event IDs are also stored in `stripe_events`.

**Subscriptions:**
- `checkout.session.completed` fulfils the first week's order and mirrors the subscription into `subscriptions`.
- Each renewal (`invoice.paid`, `billing_reason = subscription_cycle`) creates the next week's order. It copies the last delivery details and is idempotent via the unique `stripe_invoice_id`.
- `customer.subscription.updated` / `deleted` keep the status in sync.

**Order statuses:** 待付款 `pending_payment` → 已付款 `paid` → 準備中 `preparing` → 送遞中 `out_for_delivery` → 已送達 `delivered`, plus 已取消 `cancelled` and 已退款 `refunded`. Customers see a timeline at `/account/orders/[id]`.

**Emails:** v1 relies on Supabase auth emails and **Stripe receipts**. Turn those on under **Settings → Customer emails → Successful payments**. Branded order emails are marked `TODO(email)` in the code, ready for Resend or Postmark.

---

## 8. Business rules & configuration

All in `lib/config.ts` (some can be overridden by env):

| Rule | Default | Where |
| --- | --- | --- |
| Delivery fee | Free at or above HK$400, otherwise HK$40 (plans include delivery) | `shopConfig.delivery` |
| Weekly cutoff | Sunday 23:59 HKT; orders join the following Mon–Sun delivery week | `NEXT_PUBLIC_CUTOFF_WEEKDAY/HOUR/MINUTE` |
| Max qty per line | 20 (and never above `weekly_stock`) | `shopConfig.maxQtyPerLine` |
| Stripe fee estimate | 2.9% + HK$2.35 (check your real rate at stripe.com/hk/pricing) | `STRIPE_FEE_BPS`, `STRIPE_FEE_FIXED_CENTS` |
| Contact / WhatsApp | placeholders | `shopConfig.contact` |

**Profit** (admin): `Σ (unit_price − unit_cost) × qty` over paid orders, **minus refunds**. The estimated card fee is then deducted for **淨利 / 淨額**. Delivery income appears in GMV and the finance P&L, but not in food margin. Costs come from the **snapshot** in `order_items.unit_cost_cents`, so later cost edits don't rewrite history.

**Stock:** `meals.weekly_stock` is "remaining this week". At 0 the menu shows **本週已滿** and add-to-box is disabled. **/admin/meals → 重設庫存** refills every active meal for a new week.

Seed prices and COGS are placeholders. Edit them in **/admin/meals** and **/admin/plans** (or in `supabase/seed-data.mjs`, then run `npm run seed:generate`).

---

## 9. Security model

- **RLS on every table** (`003_rls.sql`):
  - Profiles: users read and update only their own row. Updatable columns are whitelisted, so `role`, `stripe_customer_id` and `apple_user_id` can't be changed, and a trigger also blocks role escalation.
  - Meals and plans: public read of active rows. **`cost_cents` is not selectable** by `anon` or `authenticated` (column privileges). Admin write policies exist.
  - Carts and items: owner only.
  - Orders: owner reads own; admin reads and updates all; **only the server inserts**. Order items hide `unit_cost_cents` from clients.
  - Order notes and audit: admin only. `stripe_events`: no client access.
- **Service role** is used only in server code (`lib/supabase/admin.ts` imports `server-only`): after `requireAdmin()`, in checkout creation, and in the webhook.
- **Admin gate** runs on the server in the layout **and** in every admin page, server action and the CSV route. Non-admins get a 404.
- **Webhook:** raw body plus `stripe.webhooks.constructEvent`, with idempotent handlers and an event-ID ledger.
- **Server actions:** zod validation, and Next's built-in Origin check against CSRF. The sign-out is `POST`-only. `?next=` is restricted to same-site paths.
- **CSV export** quotes every cell and neutralises spreadsheet formula injection.
- **Headers:** `nosniff`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`.
- `npm run db:check` proves the key RLS rules against a real Postgres engine in CI.

---

## 10. Deploying (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Add every variable from `.env.example` under **Settings → Environment Variables**. Set `NEXT_PUBLIC_SITE_URL=https://your-domain` for Production.
3. Add your domain to the Supabase **Redirect URLs**, the Google OAuth origins, and a Stripe **live** webhook endpoint (then switch to live keys).
4. The Stripe webhook route runs on the Node.js runtime and is excluded from `proxy.ts`.

---

## 11. Assets, scripts & testing

**Asset slots.** Replace these files, keeping the names:
- `public/brand/logo.svg` and `mark.svg`: the logo and favicon.
- `public/food/<meal-slug>.jpg`, `hero.jpg` and `placeholder.jpg`: meal photos, 4:5 portrait, at least 1200×1500. The included files are generated illustrations (`scripts/food-art/generate.py`).
- `public/about/founder.jpg`: the founder portrait.
- `public/brand/providers/apple.svg` and `google.png`: the official sign-in marks.

Meal photos can also be uploaded in **/admin/meals/[id]**. They go to Storage `meal-images/meals/…`, and `image_path` stores the object path.

**Testing checklist (test mode)**
1. `npm run db:check` → all checks pass.
2. Sign up with email → verify → log in → wrong password shows 電郵或密碼錯誤.
3. Forgot password → email link → `/reset-password` → new password → `/account`. Opening the same link again shows 連結已失效.
4. As a guest, add 3 meals → checkout → login wall → sign in with Google → the cart is merged.
5. Pay with `4242…` → `/account/orders?success=1` shows 付款成功 → admin sees 已付款 → stock is decremented.
6. Choose a plan → subscription checkout → `/account/plan` shows 生效中 → the portal opens.
7. Admin → mark delivered → refund → the order shows 已退款 and finance subtracts the refund.

---

## 12. Known limitations / TODO

- **Emails:** branded order confirmation and delivery emails are not implemented (`TODO(email)`); Stripe receipts cover v1.
- **Plan meal selection:** plan orders are "chef's selection" for the week. Letting subscribers pick specific meals is a v2 feature.
- **Stock races:** stock is checked at checkout and decremented on payment. Two customers paying for the last portions at the same moment can oversell by a few; `weekly_stock` never goes negative, and admins see it in the order list.
- **Rate limiting** is per-instance in memory. Use Upstash or another shared store on serverless.
- **Discounts / promo codes:** `discount_cents` is in the schema, but no promo flow exists yet. Stripe `allow_promotion_codes` is a one-line addition.
- **Admin reporting** aggregates in the app (capped at 5,000 orders per query). Move it to SQL views or materialised views as volume grows.
