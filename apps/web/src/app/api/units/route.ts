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
    })

    if (!resident) {
      // Not onboarded yet — return empty array instead of 404
      return NextResponse.json([])
    }

    const units = await prisma.unit.findMany({
      where: { estateId: resident.estateId },
      orderBy: [{ block: 'asc' }, { number: 'asc' }],
    })

    return NextResponse.json(units)
  } catch (err) {
    console.error('[GET /api/units]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })

    if (!resident || !['ADMIN', 'SUPER_ADMIN'].includes(resident.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { number, block, type } = body

    if (!number?.trim()) {
      return NextResponse.json({ error: 'Unit number is required' }, { status: 400 })
    }

    const unit = await prisma.unit.create({
      data: {
        estateId: resident.estateId,
        number: number.trim(),
        block: block?.trim() || null,
        type: type?.trim() || null,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (err) {
    console.error('[POST /api/units]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}