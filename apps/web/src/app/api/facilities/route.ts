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
    if (!resident) return NextResponse.json([])

    const facilities = await prisma.facility.findMany({
      where: { estateId: resident.estateId },
      include: {
        bookings: {
          where: {
            status:   { not: 'CANCELLED' },
            endTime:  { gte: new Date() },
          },
          select: {
            id: true, startTime: true, endTime: true, status: true,
            resident: { select: { firstName: true, lastName: true } },
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(facilities)
  } catch (err) {
    console.error('[GET /api/facilities]', err)
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

    const { name, description, capacity, feePerSlot } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Facility name is required' }, { status: 400 })
    }

    const facility = await prisma.facility.create({
      data: {
        estateId:   resident.estateId,
        name:       name.trim(),
        description: description?.trim() || null,
        capacity:   capacity ? Number(capacity) : null,
        feePerSlot: feePerSlot ? Number(feePerSlot) : 0,
      },
    })

    return NextResponse.json(facility, { status: 201 })
  } catch (err) {
    console.error('[POST /api/facilities]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}