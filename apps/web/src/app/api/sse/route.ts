import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'
import { addClient, removeClient } from '@/lib/sseStore'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resident = await prisma.resident.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!resident) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const residentId = resident.id

  const stream = new ReadableStream({
    start(controller) {
      addClient(residentId, controller)

      // Tell the client the connection is live and send their residentId
      const hello = `event: connected\ndata: ${JSON.stringify({ residentId })}\n\n`
      controller.enqueue(new TextEncoder().encode(hello))
    },
    cancel() {
      removeClient(residentId)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}