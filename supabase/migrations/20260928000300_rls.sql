-- LeanBox · 003 · Row Level Security + column privileges
--
-- Principles
--  * RLS is enabled on every table.
--  * Clients (anon / authenticated) never see cost columns: table-level SELECT
--    is revoked and re-granted column by column without cost_cents.
--  * Orders, order items, subscriptions and stripe_events are written by the
--    server (service role) only.
--  * Admin screens run on the server with the service role *after* a role
--    check; the admin policies below additionally let an admin session read
--    and update through the API.

alter table public.profiles       enable row level security;
alter table public.meals          enable row level security;
alter table public.plans          enable row level security;
alter table public.carts          enable row level security;
alter table public.cart_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_notes    enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.stripe_events  enable row level security;
alter table public.admin_audit    enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.profiles from anon, authenticated;
revoke select on public.profiles from anon;
grant update (full_name, phone, district, address_line, notes, contact_email)
  on public.profiles to authenticated;

create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: admin read all" on public.profiles
  for select to authenticated using (public.is_admin());
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- meals — public read (active only), admin write, cost hidden
-- ---------------------------------------------------------------------------
revoke select, insert, update, delete on public.meals from anon;
revoke select on public.meals from authenticated;
grant select (
  id, slug, name_zh, name_en, description_zh, description_en, ingredients_zh, ingredients_en,
  allergens, kcal, protein_g, carbs_g, fat_g, tags, price_cents, image_path, is_active,
  weekly_stock, sort_order, created_at, updated_at
) on public.meals to anon, authenticated;

create policy "meals: public read active" on public.meals
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "meals: admin insert" on public.meals
  for insert to authenticated with check (public.is_admin());
create policy "meals: admin update" on public.meals
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "meals: admin delete" on public.meals
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- plans — same pattern
-- ---------------------------------------------------------------------------
revoke select, insert, update, delete on public.plans from anon;
revoke select on public.plans from authenticated;
grant select (
  id, slug, name_zh, name_en, description_zh, description_en, meals_per_week, price_cents,
  stripe_price_id, is_featured, is_active, sort_order, created_at, updated_at
) on public.plans to anon, authenticated;

create policy "plans: public read active" on public.plans
  for select to anon, authenticated using (is_active or public.is_admin());
create policy "plans: admin insert" on public.plans
  for insert to authenticated with check (public.is_admin());
create policy "plans: admin update" on public.plans
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "plans: admin delete" on public.plans
  for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- carts / cart_items — owner only
-- ---------------------------------------------------------------------------
revoke all on public.carts, public.cart_items from anon;

create policy "carts: owner all" on public.carts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "cart_items: owner all" on public.cart_items
  for all to authenticated
  using (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id and c.user_id = (select auth.uid()) and c.status = 'active'
  ));

-- ---------------------------------------------------------------------------
-- orders — owner reads own; admin reads/updates all; server inserts
-- ---------------------------------------------------------------------------
revoke all on public.orders from anon;
revoke insert, delete on public.orders from authenticated;

create policy "orders: owner read" on public.orders
  for select to authenticated using (user_id = (select auth.uid()));
create policy "orders: admin read" on public.orders
  for select to authenticated using (public.is_admin());
create policy "orders: admin update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items — readable with the parent order, cost hidden from clients
-- ---------------------------------------------------------------------------
revoke all on public.order_items from anon;
revoke select, insert, update, delete on public.order_items from authenticated;
grant select (
  id, order_id, meal_id, plan_id, name_snapshot, name_en_snapshot, quantity, unit_price_cents, created_at
) on public.order_items to authenticated;

create policy "order_items: owner read" on public.order_items
  for select to authenticated using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.user_id = (select auth.uid())
  ));
create policy "order_items: admin read" on public.order_items
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_notes — admin only
-- ---------------------------------------------------------------------------
revoke all on public.order_notes from anon;
revoke update, delete on public.order_notes from authenticated;

create policy "order_notes: admin read" on public.order_notes
  for select to authenticated using (public.is_admin());
create policy "order_notes: admin insert" on public.order_notes
  for insert to authenticated
  with check (public.is_admin() and author_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- subscriptions — owner reads own, admin reads all, server writes
-- ---------------------------------------------------------------------------
revoke all on public.subscriptions from anon;
revoke insert, update, delete on public.subscriptions from authenticated;

create policy "subscriptions: owner read" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "subscriptions: admin read" on public.subscriptions
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- stripe_events — server only (no policies = no client access)
-- ---------------------------------------------------------------------------
revoke all on public.stripe_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- admin_audit — admin read; inserts by server (or an admin session as itself)
-- ---------------------------------------------------------------------------
revoke all on public.admin_audit from anon;
revoke update, delete on public.admin_audit from authenticated;

create policy "admin_audit: admin read" on public.admin_audit
  for select to authenticated using (public.is_admin());
create policy "admin_audit: admin insert" on public.admin_audit
  for insert to authenticated
  with check (public.is_admin() and actor_id = (select auth.uid()));
