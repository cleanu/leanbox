-- LeanBox · 001 · Core schema
-- Money is stored as integer HKD cents (8800 = HK$88).

-- gen_random_uuid() is built into Postgres 13+.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text,
  contact_email      text,             -- e.g. Apple private-relay users can add a real address
  full_name          text,
  phone              text,
  district           text,             -- "<region>/<district>", e.g. "kowloon/觀塘區"
  address_line       text,
  notes              text,
  avatar_url         text,
  apple_user_id      text,             -- Apple "sub"; Apple only shares email on first consent
  stripe_customer_id text unique,
  role               text not null default 'customer' check (role in ('customer', 'admin')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index profiles_email_idx on public.profiles (lower(email));
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
create table public.meals (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_zh         text not null,
  name_en         text not null,
  description_zh  text not null default '',
  description_en  text not null default '',
  ingredients_zh  text not null default '',
  ingredients_en  text not null default '',
  allergens       text[] not null default '{}',
  kcal            integer not null default 0 check (kcal >= 0),
  protein_g       integer not null default 0 check (protein_g >= 0),
  carbs_g         integer not null default 0 check (carbs_g >= 0),
  fat_g           integer not null default 0 check (fat_g >= 0),
  tags            text[] not null default '{}',        -- 高蛋白, 低碳, 增肌, 素
  price_cents     integer not null check (price_cents >= 0),
  cost_cents      integer not null default 0 check (cost_cents >= 0), -- COGS, admin only
  image_path      text,             -- "/food/x.jpg" (public/) or a path inside the meal-images bucket
  is_active       boolean not null default true,
  weekly_stock    integer not null default 0 check (weekly_stock >= 0),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index meals_active_sort_idx on public.meals (is_active, sort_order);
create trigger meals_updated_at before update on public.meals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- plans (weekly subscriptions)
-- ---------------------------------------------------------------------------
create table public.plans (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name_zh         text not null,
  name_en         text not null,
  description_zh  text not null default '',
  description_en  text not null default '',
  meals_per_week  integer not null check (meals_per_week > 0),
  price_cents     integer not null check (price_cents >= 0),  -- per week
  cost_cents      integer not null default 0 check (cost_cents >= 0), -- estimated weekly COGS, admin only
  stripe_price_id text,             -- recurring weekly price in Stripe
  is_featured     boolean not null default false,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- carts
-- ---------------------------------------------------------------------------
create table public.carts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete cascade,  -- null reserved for server-side guest carts
  status      text not null default 'active' check (status in ('active', 'converted')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index carts_one_active_per_user
  on public.carts (user_id) where status = 'active' and user_id is not null;
create trigger carts_updated_at before update on public.carts
  for each row execute function public.set_updated_at();

create table public.cart_items (
  cart_id           uuid not null references public.carts (id) on delete cascade,
  meal_id           uuid not null references public.meals (id) on delete cascade,
  quantity          integer not null check (quantity between 1 and 50),
  unit_price_cents  integer not null check (unit_price_cents >= 0), -- snapshot when added
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  primary key (cart_id, meal_id)
);
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  order_number                bigint generated always as identity (start with 100001) unique,
  user_id                     uuid references auth.users (id) on delete set null,
  cart_id                     uuid references public.carts (id) on delete set null,
  plan_id                     uuid references public.plans (id) on delete set null,
  kind                        text not null default 'one_time' check (kind in ('one_time', 'subscription')),
  status                      text not null default 'pending_payment' check (status in (
                                'pending_payment', 'paid', 'preparing', 'out_for_delivery',
                                'delivered', 'cancelled', 'refunded')),
  fulfillment_week            text not null check (fulfillment_week ~ '^\d{4}-W\d{2}$'),
  subtotal_cents              integer not null default 0 check (subtotal_cents >= 0),
  delivery_cents              integer not null default 0 check (delivery_cents >= 0),
  discount_cents              integer not null default 0 check (discount_cents >= 0),
  total_cents                 integer not null default 0 check (total_cents >= 0),
  refunded_cents              integer not null default 0 check (refunded_cents >= 0),
  currency                    text not null default 'hkd',
  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text,
  stripe_subscription_id      text,
  stripe_invoice_id           text unique,
  payment_error               text,
  customer_email              text,
  -- delivery snapshot
  delivery_name               text not null,
  delivery_phone              text not null,
  delivery_district           text not null,
  delivery_address            text not null,
  delivery_notes              text,
  paid_at                     timestamptz,
  cancelled_at                timestamptz,
  delivered_at                timestamptz,
  refunded_at                 timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_week_idx on public.orders (fulfillment_week);
create index orders_paid_at_idx on public.orders (paid_at);
create index orders_payment_intent_idx on public.orders (stripe_payment_intent_id);
create index orders_subscription_idx on public.orders (stripe_subscription_id);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  meal_id            uuid references public.meals (id) on delete set null,
  plan_id            uuid references public.plans (id) on delete set null,
  name_snapshot      text not null,
  name_en_snapshot   text,
  quantity           integer not null check (quantity > 0),
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  unit_cost_cents    integer not null default 0 check (unit_cost_cents >= 0), -- COGS snapshot, admin only
  created_at         timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_meal_idx on public.order_items (meal_id);

create table public.order_notes (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  author_id   uuid references auth.users (id) on delete set null,
  body        text not null check (char_length(body) between 1 and 2000),
  created_at  timestamptz not null default now()
);
create index order_notes_order_idx on public.order_notes (order_id, created_at);

-- ---------------------------------------------------------------------------
-- subscriptions (mirror of Stripe subscriptions for weekly plans)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references auth.users (id) on delete set null,
  plan_id                 uuid references public.plans (id) on delete set null,
  stripe_subscription_id  text not null unique,
  stripe_customer_id      text,
  status                  text not null,   -- Stripe status: active, past_due, canceled, …
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stripe_events (webhook idempotency)
-- ---------------------------------------------------------------------------
create table public.stripe_events (
  id            text primary key,   -- evt_…
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- admin_audit
-- ---------------------------------------------------------------------------
create table public.admin_audit (
  id          bigint generated always as identity primary key,
  actor_id    uuid references auth.users (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index admin_audit_entity_idx on public.admin_audit (entity, entity_id);
create index admin_audit_created_idx on public.admin_audit (created_at desc);
