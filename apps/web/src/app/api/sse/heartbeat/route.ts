import { NextResponse } from 'next/server'
import { sendToResident } from '@/lib/sseStore'

export async function POST(req: Request) {
  try {
    const { residentId } = await req.json()
    if (!residentId) return NextResponse.json({ ok: false })

    sendToResident(residentId, 'heartbeat', { ts: Date.now() })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}