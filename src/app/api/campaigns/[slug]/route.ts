import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params

  const { data: campaign, error } = await supabaseServer
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: agg, error: aggErr } = await supabaseServer.rpc('aggregate_votes', { _ids: [campaign.id] })
  if (aggErr) {
    return NextResponse.json({ error: aggErr.message }, { status: 500 })
  }
  const votes = agg?.[0]?.votes ?? 0

  return NextResponse.json({ ...campaign, votes })
}
