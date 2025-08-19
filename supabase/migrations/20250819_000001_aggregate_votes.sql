-- =========================
-- v2: Агрегация голосов по списку campaign_id
-- =========================

-- Функция aggregate_votes(_ids uuid[])
-- Возвращает: campaign_id, votes
-- Особенности безопасности:
--  - SECURITY DEFINER: выполняется с правами владельца (обходит RLS на votes)
--  - Фильтрует только опубликованные кампании (status='published'), чтобы не раскрывать черновики
--  - Доступна ролям anon и authenticated для публичного чтения агрегатов
create or replace function public.aggregate_votes(_ids uuid[])
returns table (
  campaign_id uuid,
  votes       bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with input_ids as (
    select distinct id
    from unnest(_ids) as t(id)
    where id is not null
  ),
  published as (
    select c.id
    from input_ids i
    join public.campaigns c on c.id = i.id
    where c.status = 'published'
  ),
  counts as (
    select v.campaign_id, count(*)::bigint as votes
    from public.votes v
    join published p on p.id = v.campaign_id
    group by v.campaign_id
  )
  select p.id as campaign_id, coalesce(c.votes, 0)::bigint as votes
  from published p
  left join counts c on c.campaign_id = p.id
  order by votes desc, campaign_id;
$$;

-- Владелец функции (важно для SECURITY DEFINER и обхода RLS)
-- (В Supabase миграции обычно выполняются от postgres, так что команда ниже пройдет.)
alter function public.aggregate_votes(uuid[]) owner to postgres;

-- Ограничиваем и назначаем привилегии на исполнение
revoke all on function public.aggregate_votes(uuid[]) from public;
grant execute on function public.aggregate_votes(uuid[]) to anon, authenticated, service_role;