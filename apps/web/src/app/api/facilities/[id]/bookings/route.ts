import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: facilityId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const { startTime, endTime } = await req.json()

    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: 'Start time and end time are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end   = new Date(endTime)

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: 'Booking must be in the future' },
        { status: 400 }
      )
    }

    const facility = await prisma.facility.findFirst({
      where: { id: facilityId, estateId: resident.estateId },
    })
    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    const conflict = await prisma.facilityBooking.findFirst({
      where: {
        facilityId,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: end   } },
          { endTime:   { gt: start } },
        ],
      },
    })

    if (conflict) {
      return NextResponse.json(
        { error: 'This time slot is already booked. Please choose a different time.' },
        { status: 409 }
      )
    }

    const booking = await prisma.facilityBooking.create({
      data: {
        facilityId,
        residentId: resident.id,
        startTime:  start,
        endTime:    end,
        status:     'CONFIRMED',
      },
      include: {
        facility: { select: { name: true } },
        resident: { select: { firstName: true, lastName: true } },
      },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/facilities/:id/bookings]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}