-- KOL discount codes. Each row mirrors a Stripe Coupon + Promotion Code
-- (Stripe validates and applies the discount); orders.kol_code_id records
-- which code an order used so sales can be attributed to the KOL.

create table public.kol_codes (
  id                        uuid primary key default gen_random_uuid(),
  instagram_handle          text not null check (instagram_handle ~ '^[a-z0-9._]{1,30}$'), -- without "@"
  code                      text not null unique check (code ~ '^[A-Z0-9]{3,20}$'),
  percent_off               integer check (percent_off between 1 and 100),
  amount_off_cents          integer check (amount_off_cents > 0),
  stripe_coupon_id          text not null,
  stripe_promotion_code_id  text not null unique,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check ((percent_off is null) <> (amount_off_cents is null))
);
create trigger kol_codes_set_updated_at before update on public.kol_codes
  for each row execute function public.set_updated_at();

alter table public.orders add column kol_code_id uuid references public.kol_codes (id) on delete set null;
create index orders_kol_code_idx on public.orders (kol_code_id, paid_at) where kol_code_id is not null;

-- Admin-only: the app reads codes server-side with the service role.
alter table public.kol_codes enable row level security;
create policy "kol_codes: admin read" on public.kol_codes
  for select to authenticated using (public.is_admin());
