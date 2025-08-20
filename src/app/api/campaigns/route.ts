import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

const PAGE_SIZE = 10

interface Campaign {
  id: string
  created_at: string
  [key: string]: unknown
}

interface AggRow {
  campaign_id: string
  votes: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query')?.trim() || ''
  const tagsParam = searchParams.get('tags')
  const sort = searchParams.get('sort') || 'popular'
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
  const durationMin = parseInt(searchParams.get('durationMin') || '', 10)
  const durationMax = parseInt(searchParams.get('durationMax') || '', 10)
  const playersMin = parseInt(searchParams.get('playersMin') || '', 10)
  const playersMax = parseInt(searchParams.get('playersMax') || '', 10)
  const age = searchParams.get('age')?.trim()
  const statusesParam = searchParams.get('statuses')

  let sb = supabaseServer.from('campaigns').select('*')

  if (statusesParam) {
    const statuses = statusesParam.split(',').map((s) => s.trim()).filter(Boolean)
    if (statuses.length) sb = sb.in('status', statuses)
  } else {
    sb = sb.eq('status', 'published')
  }

  if (query) {
    const like = `%${query}%`
    sb = sb.or(`title.ilike.${like},short_description.ilike.${like}`)
  }

  if (tagsParam) {
    const tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length) sb = sb.contains('tags', tags)
  }

  if (!Number.isNaN(durationMin)) sb = sb.gte('duration_hours', durationMin)
  if (!Number.isNaN(durationMax)) sb = sb.lte('duration_hours', durationMax)
  if (!Number.isNaN(playersMin)) sb = sb.gte('players_min', playersMin)
  if (!Number.isNaN(playersMax)) sb = sb.lte('players_max', playersMax)
  if (age) sb = sb.eq('age', age)

  const { data, error } = await sb
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const campaigns = (data ?? []) as Campaign[]

  // facets
  const tagSet = new Set<string>()
  const statusSet = new Set<string>()
  const ageSet = new Set<string>()
  let durMinAll = Infinity
  let durMaxAll = 0
  let playersMinAll = Infinity
  let playersMaxAll = 0

  campaigns.forEach((c: Campaign) => {
    ;(c.tags as string[] | undefined)?.forEach((t) => tagSet.add(t))
    if (typeof c.status === 'string') statusSet.add(c.status)
    if (typeof c.age === 'string') ageSet.add(c.age)
    if (typeof c.duration_hours === 'number') {
      durMinAll = Math.min(durMinAll, c.duration_hours)
      durMaxAll = Math.max(durMaxAll, c.duration_hours)
    }
    if (typeof c.players_min === 'number') {
      playersMinAll = Math.min(playersMinAll, c.players_min)
    }
    if (typeof c.players_max === 'number') {
      playersMaxAll = Math.max(playersMaxAll, c.players_max)
    }
  })

  const facets = {
    tags: Array.from(tagSet).sort(),
    statuses: Array.from(statusSet).sort(),
    ages: Array.from(ageSet).sort(),
    duration: {
      min: durMinAll === Infinity ? 0 : durMinAll,
      max: durMaxAll,
    },
    players: {
      min: playersMinAll === Infinity ? 0 : playersMinAll,
      max: playersMaxAll,
    },
  }

  const ids = campaigns.map((c) => c.id)
  const { data: aggData, error: aggErr } = await supabaseServer.rpc('aggregate_votes', { _ids: ids })
  if (aggErr) {
    return NextResponse.json({ error: aggErr.message }, { status: 500 })
  }
  const agg = (aggData ?? []) as AggRow[]
  const voteMap: Record<string, number> = {}
  agg.forEach((row: AggRow) => {
    voteMap[row.campaign_id] = row.votes
  })

  let sortedIds: string[]
  switch (sort) {
    case 'new':
      sortedIds = campaigns
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .map((c) => c.id)
      break
    case 'title':
      sortedIds = campaigns
        .sort((a, b) => String(a.title).localeCompare(String(b.title)))
        .map((c) => c.id)
      break
      case 'duration':
        sortedIds = campaigns
          .sort((a, b) => {
            const da = typeof a.duration_hours === 'number' ? a.duration_hours : 0
            const db = typeof b.duration_hours === 'number' ? b.duration_hours : 0
            return da - db
          })
          .map((c) => c.id)
        break
      case 'players':
        sortedIds = campaigns
          .sort((a, b) => {
            const pa = typeof a.players_min === 'number' ? a.players_min : 0
            const pb = typeof b.players_min === 'number' ? b.players_min : 0
            return pa - pb
          })
          .map((c) => c.id)
        break
    case 'age':
      sortedIds = campaigns
        .sort(
          (a, b) =>
            parseInt(String(a.age ?? '0'), 10) - parseInt(String(b.age ?? '0'), 10),
        )
        .map((c) => c.id)
      break
    default:
      sortedIds = agg.map((row: AggRow) => row.campaign_id)
  }

  const total = campaigns.length
  const start = (page - 1) * PAGE_SIZE
  const pagedIds = sortedIds.slice(start, start + PAGE_SIZE)

  const items = pagedIds.map((id) => {
    const c = campaigns.find((cam) => cam.id === id)!
    return { ...c, votes30d: voteMap[id] ?? 0 }
  })

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE, facets })
}
