import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'
import { sendToResident } from '@/lib/sseStore'

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
      return NextResponse.json(
        { error: 'Only security staff can check in visitors' },
        { status: 403 }
      )
    }

    const { accessCode } = await req.json()
    if (!accessCode?.trim()) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 })
    }

    const visitor = await prisma.visitor.findFirst({
      where: {
        accessCode: accessCode.trim(),
        estateId:   security.estateId,
        status:     'EXPECTED',
      },
      include: {
        resident: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            unit: { select: { number: true, block: true } },
          },
        },
      },
    })

    if (!visitor) {
      return NextResponse.json(
        { error: 'Invalid or expired access code. Visitor may have already checked in or been cancelled.' },
        { status: 404 }
      )
    }

    const updated = await prisma.visitor.update({
      where: { id: visitor.id },
      data:  { status: 'ARRIVED', arrivedAt: new Date() },
    })

    // Fire real-time SSE event directly to the resident's open connection
    sendToResident(visitor.residentId, 'visitor-arrived', {
      visitorName: visitor.name,
      purpose:     visitor.purpose,
      arrivedAt:   updated.arrivedAt,
      unit: visitor.resident.unit
        ? `${visitor.resident.unit.block ? visitor.resident.unit.block + ', ' : ''}${visitor.resident.unit.number}`
        : null,
    })

    return NextResponse.json({
      success: true,
      visitor: {
        name:         visitor.name,
        purpose:      visitor.purpose,
        residentName: `${visitor.resident.firstName} ${visitor.resident.lastName}`,
        unit: visitor.resident.unit
          ? `${visitor.resident.unit.block ? visitor.resident.unit.block + ', ' : ''}${visitor.resident.unit.number}`
          : 'Unknown unit',
      },
    })
  } catch (err) {
    console.error('[POST /api/visitors/checkin]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}