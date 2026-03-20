import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const where = ['ADMIN', 'SUPER_ADMIN'].includes(resident.role)
      ? { id: bookingId }
      : { id: bookingId, residentId: resident.id }

    const booking = await prisma.facilityBooking.update({
      where,
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json(booking)
  } catch (err: any) {
    console.error('[PATCH /api/facilities/bookings/:bookingId]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}