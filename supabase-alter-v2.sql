-- Ejecuta esto en el SQL Editor de Supabase
-- Añade todos los campos del flujo n8n a la tabla products

alter table public.products
  add column if not exists image_url     text,
  add column if not exists price_min     numeric(10,2),
  add column if not exists price_max     numeric(10,2),
  add column if not exists brand         text,
  add column if not exists condition     text,
  add column if not exists size          text,
  add column if not exists dimensions    text,
  add column if not exists material      text,
  add column if not exists defects       text,
  add column if not exists shipping      text,
  add column if not exists keywords      text,
  add column if not exists notes         text,
  add column if not exists drive_file_id text unique;
