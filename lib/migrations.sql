DROP POLICY IF EXISTS "Users can read own row" ON users;
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Stores the public-facing identity: username + optional email for account linking.
-- Must be created before `users` because `users` is just an FK anchor for carts.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   text unique not null,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Anyone (including unauthenticated visitors) may read usernames so the
-- availability check works before a session is created.
create policy "profiles_public_read"
  on public.profiles for select
  using (true);

-- Only the owner may insert or update their own profile row.
create policy "profiles_owner_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_owner_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Mirrors auth.users so app code can JOIN without touching the auth schema.
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Auto-populate when a new auth user is created (covers anonymous sign-ins).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);

-- ─── Carts ───────────────────────────────────────────────────────────────────
create table if not exists public.carts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.carts enable row level security;

create policy "Users can manage own cart"
  on public.carts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Cart Items ───────────────────────────────────────────────────────────────
create table if not exists public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts (id) on delete cascade,
  product_id  text not null,
  name        text not null,
  price       numeric(10, 2) not null default 0,
  brand       text not null default '',
  category    text not null default '',
  image_url   text not null default '',
  ean         text,
  size        text,
  color       text,
  scanned_at  text,
  shipped_by  text,
  quantity    integer not null default 1,
  created_at  timestamptz not null default now()
);

alter table public.cart_items enable row level security;

create policy "Users can manage own cart items"
  on public.cart_items for all
  using (
    cart_id in (
      select id from public.carts where user_id = auth.uid()
    )
  )
  with check (
    cart_id in (
      select id from public.carts where user_id = auth.uid()
    )
  );
