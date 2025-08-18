-- Enable useful extensions
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive text (может пригодиться)

-- =========================
-- 1) Типы / enum для статуса кампании
-- =========================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type campaign_status as enum ('draft','published','archived');
  end if;
end $$;

-- =========================
-- 2) Таблица campaigns
-- =========================
create table if not exists public.campaigns (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  slug               text not null,
  short_description  text not null,
  full_description   text not null,               -- markdown
  cover_url          text,
  gallery            jsonb not null default '[]'::jsonb, -- массив url
  tags               text[] not null default '{}',
  duration_hours     integer,
  players_min        integer,
  players_max        integer,
  age                text,                         -- например: '18+'
  status             campaign_status not null default 'draft',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  -- Базовые проверки
  constraint campaigns_short_desc_len check (char_length(short_description) <= 200),
  constraint campaigns_gallery_is_array check (jsonb_typeof(gallery) = 'array'),
  constraint campaigns_players_min check (players_min is null or players_min >= 1),
  constraint campaigns_players_max check (players_max is null or (players_min is null or players_max >= players_min)),
  constraint campaigns_duration_nonneg check (duration_hours is null or duration_hours >= 0),
  constraint campaigns_slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- Уникальность slug (регистрочувствительная)
create unique index if not exists campaigns_slug_key on public.campaigns (slug);

-- Альтернативно, если нужна регистронезависимая уникальность (раскомментировать и удалить индекс выше):
-- create unique index if not exists campaigns_slug_key_ci on public.campaigns (lower(slug));

-- Поиск по статусу/созданию
create index if not exists campaigns_status_idx on public.campaigns (status);
create index if not exists campaigns_created_at_idx on public.campaigns (created_at desc);

-- Триггер обновления updated_at
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists set_updated_at_campaigns on public.campaigns;
create trigger set_updated_at_campaigns
before update on public.campaigns
for each row execute function public.set_updated_at();

-- =========================
-- 3) Таблица votes
-- =========================
create table if not exists public.votes (
  id                uuid primary key default gen_random_uuid(),
  campaign_id       uuid not null references public.campaigns(id) on delete cascade,
  fingerprint_hash  text not null,  -- хэш браузерного «отпечатка»
  ip_hash           text not null,  -- хэш IP
  user_agent_hash   text,           -- хэш UA (опционально)
  created_at        timestamptz not null default now()
);

-- Не даём голосовать дважды с одним fingerprint по одной кампании
create unique index if not exists votes_unique_campaign_fingerprint
  on public.votes (campaign_id, fingerprint_hash);

-- Полезные индексы
create index if not exists votes_campaign_id_idx on public.votes (campaign_id);
create index if not exists votes_fingerprint_idx  on public.votes (fingerprint_hash);
create index if not exists votes_ip_idx           on public.votes (ip_hash);

-- =========================
-- 4) Таблица admins (опционально для MVP)
-- =========================
-- create table if not exists public.admins (
--   id    uuid primary key default gen_random_uuid(),
--   email text not null unique,
--   role  text not null check (role in ('owner','editor')) default 'editor',
--   created_at timestamptz not null default now()
-- );

-- =========================
-- 5) Включаем RLS
-- =========================
alter table public.campaigns enable row level security;
alter table public.votes     enable row level security;
-- alter table public.admins   enable row level security; -- если используете

-- =========================
-- 6) Политики безопасности (RLS)
-- =========================

-- campaigns: публичное чтение только опубликованных
drop policy if exists "public can read published campaigns" on public.campaigns;
create policy "public can read published campaigns"
  on public.campaigns
  for select
  to anon, authenticated
  using (status = 'published');

-- campaigns: запись только сервером (service key).
-- Ничего не разрешаем для anon/authenticated (нет policy на insert/update/delete),
-- service_role по умолчанию bypass RLS в Supabase.
-- На случай явной политики (необязательно):
-- drop policy if exists "server can write campaigns" on public.campaigns;
-- create policy "server can write campaigns"
--   on public.campaigns
--   for all
--   to public
--   using (auth.role() = 'service_role')
--   with check (auth.role() = 'service_role');

-- votes: вставка только через серверный роут (service key).
-- Для anon/authenticated не создаём insert-политик → вставка запрещена.
-- При желании явно запретить:
-- drop policy if exists "no public insert votes" on public.votes;
-- create policy "no public insert votes"
--   on public.votes
--   for insert
--   to anon, authenticated
--   with check (false);

-- votes: чтение голосов публично не нужно → политики select не добавляем.
-- (Сервис-ключ обходит RLS и может читать/агрегировать на сервере.)

-- Опционально: если хотите разрешить публично считывать метрики по опубликованным кампаниям,
-- лучше отдавать их через серверный эндпоинт или отдельный материализованный view без PII.