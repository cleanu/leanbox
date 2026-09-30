#!/usr/bin/env node
// Applies supabase/migrations/*.sql + seed.sql to an in-memory Postgres (PGlite)
// with minimal Supabase stubs (auth schema, roles, storage) and runs RLS smoke
// tests. No Docker or Supabase account required:
//   npm run db:check
import { PGlite } from "@electric-sql/pglite";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();

const STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  email_confirmed_at timestamptz,
  raw_user_meta_data jsonb default '{}'::jsonb,
  raw_app_meta_data jsonb default '{}'::jsonb
);
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as
  $$ select current_setting('request.jwt.claim.role', true) $$;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
create table storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
-- Supabase's default privileges on public tables
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};

async function as(role, uid, fn) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ""}', false);
                 select set_config('request.jwt.claim.role', '${role}', false); set role ${role};`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role;");
  }
}

async function expectError(label, promise) {
  try {
    await promise;
    fail(`${label} (expected an error)`);
  } catch {
    ok(label);
  }
}

console.log("Applying stubs…");
await db.exec(STUBS);

const migrations = readdirSync(join(root, "supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
for (const file of migrations) {
  process.stdout.write(`Applying ${file}… `);
  await db.exec(readFileSync(join(root, "supabase/migrations", file), "utf8"));
  console.log("ok");
}
process.stdout.write("Applying seed.sql… ");
await db.exec(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
console.log("ok");

console.log("\nChecks");
const alice = "00000000-0000-4000-a000-00000000000a";
const bob = "00000000-0000-4000-a000-00000000000b";
const adminId = "00000000-0000-4000-a000-0000000000ad";
await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data) values
    ('${alice}', 'alice@example.com', '{"full_name":"Alice"}'),
    ('${bob}', 'bob@example.com', '{}'),
    ('${adminId}', 'admin@example.com', '{}');
  update public.profiles set role = 'admin' where id = '${adminId}';
`);

const { rows: profiles } = await db.query("select count(*)::int as n from public.profiles");
profiles[0].n === 3 ? ok("profile trigger created 3 profiles") : fail("profile trigger");

const { rows: mealCount } = await db.query("select count(*)::int as n from public.meals");
mealCount[0].n >= 3 ? ok(`seed has ${mealCount[0].n} meals`) : fail("seed meals");

// anon can read active meals but not cost
await as("anon", null, async () => {
  const { rows } = await db.query("select id, price_cents from public.meals");
  rows.length > 0 ? ok("anon reads meals") : fail("anon reads meals");
});
await expectError("anon cannot read meals.cost_cents", as("anon", null, () => db.query("select cost_cents from public.meals")));
await expectError("authenticated cannot read plans.cost_cents", as("authenticated", alice, () => db.query("select cost_cents from public.plans")));
await expectError("anon cannot insert meals", as("anon", null, () => db.query("insert into public.meals (slug,name_zh,name_en,price_cents) values ('x','x','x',1)")));

// profiles
await as("authenticated", alice, async () => {
  const { rows } = await db.query("select id from public.profiles");
  rows.length === 1 && rows[0].id === alice ? ok("user sees only own profile") : fail(`user sees ${rows.length} profiles`);
  await db.query("update public.profiles set full_name = 'Alice Chan' where id = $1", [alice]);
  const { rows: other } = await db.query("update public.profiles set full_name = 'x' where id = $1 returning id", [bob]);
  other.length === 0 ? ok("user cannot update another profile") : fail("user updated another profile");
});
await expectError("user cannot escalate own role", as("authenticated", alice, () => db.query("update public.profiles set role = 'admin' where id = $1", [alice])));
await as("authenticated", adminId, async () => {
  const { rows } = await db.query("select id from public.profiles");
  rows.length === 3 ? ok("admin reads all profiles") : fail("admin reads all profiles");
});

// carts
await as("authenticated", alice, async () => {
  const { rows } = await db.query("insert into public.carts (user_id) values ($1) returning id", [alice]);
  await db.query(
    "insert into public.cart_items (cart_id, meal_id, quantity, unit_price_cents) values ($1, '0e1f0000-0000-4000-8000-000000000001', 2, 8800)",
    [rows[0].id],
  );
  ok("user creates own cart + item");
});
await expectError("user cannot create cart for someone else", as("authenticated", bob, () => db.query("insert into public.carts (user_id) values ($1)", [alice])));
await as("authenticated", bob, async () => {
  const { rows } = await db.query("select * from public.cart_items");
  rows.length === 0 ? ok("other user cannot see cart items") : fail("cart items leaked");
});

// orders (server-side insert as service role)
const { rows: cartRows } = await db.query("select id from public.carts where user_id = $1", [alice]);
const { rows: orderRows } = await as("service_role", null, () =>
  db.query(
    `insert into public.orders (user_id, cart_id, fulfillment_week, subtotal_cents, delivery_cents, total_cents,
       delivery_name, delivery_phone, delivery_district, delivery_address)
     values ($1, $2, '2026-W41', 17600, 4000, 21600, 'Alice', '+85291234567', 'kowloon/觀塘區', '1 Test Road')
     returning id, order_number`,
    [alice, cartRows[0].id],
  ),
);
const orderId = orderRows[0].id;
Number(orderRows[0].order_number) === 100001 ? ok("order_number starts at 100001") : fail("order_number");
await as("service_role", null, () =>
  db.query(
    `insert into public.order_items (order_id, meal_id, name_snapshot, quantity, unit_price_cents, unit_cost_cents)
     values ($1, '0e1f0000-0000-4000-8000-000000000001', '香煎雞胸糙米飯', 2, 8800, 3200)`,
    [orderId],
  ),
);
await expectError("user cannot insert orders", as("authenticated", alice, () =>
  db.query("insert into public.orders (user_id, fulfillment_week, delivery_name, delivery_phone, delivery_district, delivery_address) values ($1,'2026-W41','a','b','c','d')", [alice])));
await as("authenticated", alice, async () => {
  const { rows } = await db.query("select id, status from public.orders");
  rows.length === 1 ? ok("owner reads own order") : fail("owner reads own order");
  const { rows: items } = await db.query("select quantity, unit_price_cents from public.order_items");
  items.length === 1 ? ok("owner reads own order items") : fail("owner reads order items");
  const { rows: upd } = await db.query("update public.orders set status = 'delivered' returning id");
  upd.length === 0 ? ok("owner cannot update order status") : fail("owner updated order");
});
await expectError("owner cannot read unit_cost_cents", as("authenticated", alice, () => db.query("select unit_cost_cents from public.order_items")));
await as("authenticated", bob, async () => {
  const { rows } = await db.query("select id from public.orders");
  rows.length === 0 ? ok("other user cannot see order") : fail("order leaked");
});

// fulfilment (idempotent)
const { rows: stockBefore } = await db.query("select weekly_stock from public.meals where id = '0e1f0000-0000-4000-8000-000000000001'");
const first = await as("service_role", null, () => db.query("select public.fulfill_order($1, 'pi_test', null) as ok", [orderId]));
const second = await as("service_role", null, () => db.query("select public.fulfill_order($1, 'pi_test', null) as ok", [orderId]));
first.rows[0].ok === true && second.rows[0].ok === false ? ok("fulfill_order is idempotent") : fail("fulfill_order idempotency");
const { rows: stockAfter } = await db.query("select weekly_stock from public.meals where id = '0e1f0000-0000-4000-8000-000000000001'");
stockAfter[0].weekly_stock === stockBefore[0].weekly_stock - 2 ? ok("stock decremented once by 2") : fail("stock decrement");
const { rows: cartAfter } = await db.query("select status, (select count(*)::int from public.cart_items where cart_id = carts.id) as n from public.carts where id = $1", [cartRows[0].id]);
cartAfter[0].status === "converted" && cartAfter[0].n === 0 ? ok("cart cleared + converted") : fail("cart conversion");
await expectError("clients cannot call fulfill_order", as("authenticated", alice, () => db.query("select public.fulfill_order($1)", [orderId])));

// admin
await as("authenticated", adminId, async () => {
  const { rows } = await db.query("update public.orders set status = 'preparing' where id = $1 returning id", [orderId]);
  rows.length === 1 ? ok("admin can update order status") : fail("admin update order");
  await db.query("insert into public.order_notes (order_id, author_id, body) values ($1, $2, 'Leave at lobby')", [orderId, adminId]);
  ok("admin adds internal note");
});
await as("authenticated", alice, async () => {
  const { rows } = await db.query("select * from public.order_notes");
  rows.length === 0 ? ok("customer cannot read internal notes") : fail("notes leaked");
});
await expectError("stripe_events hidden from clients", as("authenticated", adminId, () => db.query("select * from public.stripe_events")));

console.log(failures ? `\n${failures} check(s) failed` : "\nAll database checks passed");
process.exit(failures ? 1 : 0);
