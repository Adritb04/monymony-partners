-- ============================================================
-- PartnerSync — Schema SQL para Supabase
-- Ejecuta esto en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- 1. USUARIOS (partners, subadmins, admins)
create table if not exists public.users (
  id            uuid default gen_random_uuid() primary key,
  name          text not null,
  email         text unique not null,
  username      text unique not null,
  password_hash text not null,
  role          text not null check (role in ('partner', 'subadmin', 'admin')),
  commission    numeric(5,2) default 10,
  status        text not null default 'active' check (status in ('active', 'pending', 'inactive')),
  created_at    timestamptz default now()
);

-- 2. PRODUCTOS
create table if not exists public.products (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  category    text not null,
  price       numeric(10,2) not null,
  emoji       text default '📦',
  description text,
  stock       integer default 0,
  status      text not null default 'available' check (status in ('available', 'archived')),
  created_at  timestamptz default now()
);

-- 3. SELECCIONES DE PARTNER (corazón del sistema)
create table if not exists public.partner_products (
  id          uuid default gen_random_uuid() primary key,
  partner_id  uuid not null references public.users(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  status      text not null check (status in ('selected', 'sold', 'removed')),
  updated_at  timestamptz default now(),
  sold_at     timestamptz,
  price_sold  numeric(10,2),
  unique(partner_id, product_id)
);

-- Índices para rendimiento
create index if not exists idx_pp_partner on public.partner_products(partner_id);
create index if not exists idx_pp_product on public.partner_products(product_id);
create index if not exists idx_pp_status  on public.partner_products(status);

-- ============================================================
-- RLS (Row Level Security) — Recomendado en producción
-- ============================================================
alter table public.users           enable row level security;
alter table public.products        enable row level security;
alter table public.partner_products enable row level security;

-- Por ahora permite todo (ajusta en producción)
create policy "allow all users"    on public.users            for all using (true) with check (true);
create policy "allow all products" on public.products         for all using (true) with check (true);
create policy "allow all partner_products" on public.partner_products for all using (true) with check (true);

-- ============================================================
-- DATOS DE PRUEBA (seed)
-- ============================================================

-- Usuarios demo
insert into public.users (name, email, username, password_hash, role, commission, status) values
  ('Admin Principal', 'admin@partnersync.com', 'admin', 'admin123', 'admin', 0, 'active'),
  ('SubAdmin Demo', 'subadmin@partnersync.com', 'subadmin', 'sub123', 'subadmin', 0, 'active'),
  ('Carlos Romero', 'carlos@tienda.es', 'cromero', 'carlos123', 'partner', 15, 'active'),
  ('Ana García', 'ana@shop.com', 'agarcia', 'ana123', 'partner', 12, 'active'),
  ('Luis Martínez', 'luis@market.es', 'lmartinez', 'luis123', 'partner', 10, 'pending')
on conflict (username) do nothing;

-- Productos demo
insert into public.products (name, category, price, emoji, description, stock) values
  ('Sony WH-1000XM5', 'Electrónica', 299, '🎧', 'Auriculares premium cancelación de ruido', 15),
  ('iPhone 15 Pro', 'Móviles', 1199, '📱', 'Smartphone Apple última generación', 8),
  ('MacBook Air M3', 'Portátiles', 1299, '💻', 'Portátil ultraligero con chip M3', 5),
  ('iPad Pro 12.9"', 'Tablets', 1099, '📱', 'Tablet profesional con chip M2', 10),
  ('AirPods Pro 2', 'Electrónica', 279, '🎧', 'Auriculares inalámbricos con ANC', 20),
  ('Apple Watch S9', 'Wearables', 399, '⌚', 'Smartwatch con chip S9', 12),
  ('Samsung 4K 55"', 'TV', 699, '📺', 'Smart TV 4K QLED 55 pulgadas', 6),
  ('PlayStation 5', 'Gaming', 549, '🎮', 'Consola Sony última generación', 3),
  ('Nike Air Max 2024', 'Calzado', 159, '👟', 'Zapatillas deportivas premium', 25),
  ('Kindle Paperwhite', 'eReaders', 149, '📖', 'eReader con pantalla 6.8"', 18)
on conflict do nothing;
