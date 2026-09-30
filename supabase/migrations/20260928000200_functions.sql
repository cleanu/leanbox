-- LeanBox · 002 · Auth triggers, helpers and order fulfilment

-- ---------------------------------------------------------------------------
-- New auth user → profile row
-- Admin bootstrap by ADMIN_EMAILS happens in the app (server-side) on sign-in,
-- because env vars are not visible to Postgres. You can also promote manually:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_provider text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  insert into public.profiles (id, email, full_name, avatar_url, apple_user_id)
  values (
    new.id,
    new.email,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    new.raw_user_meta_data ->> 'avatar_url',
    case when v_provider = 'apple'
      then coalesce(new.raw_user_meta_data ->> 'sub', new.raw_user_meta_data ->> 'provider_id')
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user confirms an email change
-- (e.g. an Apple private-relay user adds a real email later).
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- is_admin(): used by RLS policies. SECURITY DEFINER avoids policy recursion.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Guard: only admins / service role can change profiles.role.
-- (Column privileges already block it for clients; this is belt and braces.)
-- ---------------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('anon', 'authenticated')
     and not public.is_admin() then
    raise exception 'only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ---------------------------------------------------------------------------
-- fulfill_order(): atomically mark a pending order paid, decrement weekly
-- stock and remove the purchased lines from the cart. Returns false when the
-- order was already processed, which makes webhook retries and the
-- success-page sync idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.fulfill_order(
  p_order_id uuid,
  p_payment_intent text default null,
  p_subscription text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cart uuid;
begin
  update public.orders
     set status = 'paid',
         paid_at = coalesce(paid_at, now()),
         stripe_payment_intent_id = coalesce(p_payment_intent, stripe_payment_intent_id),
         stripe_subscription_id = coalesce(p_subscription, stripe_subscription_id),
         payment_error = null,
         cancelled_at = null
   where id = p_order_id
     and status = 'pending_payment'
  returning cart_id into v_cart;

  if not found then
    return false;
  end if;

  -- Decrement weekly stock (never below zero).
  update public.meals m
     set weekly_stock = greatest(m.weekly_stock - oi.qty, 0)
    from (
      select meal_id, sum(quantity)::int as qty
        from public.order_items
       where order_id = p_order_id and meal_id is not null
       group by meal_id
    ) oi
   where m.id = oi.meal_id;

  -- Remove purchased lines from the cart; close it if nothing is left.
  if v_cart is not null then
    delete from public.cart_items ci
     using public.order_items oi
     where ci.cart_id = v_cart
       and oi.order_id = p_order_id
       and oi.meal_id = ci.meal_id;

    update public.carts c
       set status = 'converted'
     where c.id = v_cart
       and not exists (select 1 from public.cart_items where cart_id = v_cart);
  end if;

  return true;
end;
$$;

revoke all on function public.fulfill_order(uuid, text, text) from public, anon, authenticated;
grant execute on function public.fulfill_order(uuid, text, text) to service_role;
