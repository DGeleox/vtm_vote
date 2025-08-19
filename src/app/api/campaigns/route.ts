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
  const sort = searchParams.get('sort') || 'popularity'
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)

  let sb = supabaseServer.from('campaigns').select('*').eq('status', 'published')

  if (query) {
    const like = `%${query}%`
    sb = sb.or(`title.ilike.${like},short_description.ilike.${like}`)
  }

  if (tagsParam) {
    const tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean)
    if (tags.length) {
      sb = sb.contains('tags', tags)
    }
  }

  const { data, error } = await sb
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const campaigns = (data ?? []) as Campaign[]

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
  if (sort === 'new') {
    sortedIds = campaigns
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((c) => c.id)
  } else {
    sortedIds = agg.map((row: AggRow) => row.campaign_id)
  }

  const total = campaigns.length
  const start = (page - 1) * PAGE_SIZE
  const pagedIds = sortedIds.slice(start, start + PAGE_SIZE)

  const items = pagedIds.map((id) => {
    const c = campaigns.find((cam) => cam.id === id)!
    return { ...c, votes: voteMap[id] ?? 0 }
  })

  return NextResponse.json({ items, total, page, pageSize: PAGE_SIZE })
}
