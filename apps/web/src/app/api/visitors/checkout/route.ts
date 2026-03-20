import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const security = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })
    if (!security || !['SECURITY', 'ADMIN', 'SUPER_ADMIN'].includes(security.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { visitorId } = await req.json()
    if (!visitorId) {
      return NextResponse.json({ error: 'visitorId is required' }, { status: 400 })
    }

    const visitor = await prisma.visitor.update({
      where: { id: visitorId, estateId: security.estateId },
      data:  { status: 'EXITED', exitedAt: new Date() },
    })

    return NextResponse.json(visitor)
  } catch (err) {
    console.error('[POST /api/visitors/checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}