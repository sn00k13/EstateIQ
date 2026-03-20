import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        estateId: true,
        unit: { select: { number: true, block: true } },
      },
    })

    if (!resident) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(resident)
  } catch (err) {
    console.error('[GET /api/residents/me]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}