import { sha256Hex } from '@/lib/hash'
import { supabaseServer } from '@/lib/supabaseServer'
import { NextRequest, NextResponse } from 'next/server'

interface VoteBody {
  campaignId?: string
  fingerprint?: string
}

export async function POST(req: NextRequest) {
  let body: VoteBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { campaignId, fingerprint } = body
  if (!campaignId || !fingerprint) {
    return NextResponse.json({ error: 'campaignId and fingerprint are required' }, { status: 400 })
  }

  const { data: campaign } = await supabaseServer
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('status', 'published')
    .maybeSingle()
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const fingerprintHash = sha256Hex(fingerprint)

  const { data: existing } = await supabaseServer
    .from('votes')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('fingerprint_hash', fingerprintHash)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Already voted' }, { status: 409 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '0.0.0.0'
  const ua = req.headers.get('user-agent') || ''

  const { error } = await supabaseServer.from('votes').insert({
    campaign_id: campaignId,
    fingerprint_hash: fingerprintHash,
    ip_hash: sha256Hex(ip),
    user_agent_hash: ua ? sha256Hex(ua) : null,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
