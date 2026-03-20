import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const levy = await prisma.levy.findFirst({
      where: { id, estateId: resident.estateId },
      include: {
        payments: {
          include: {
            unit:     { select: { id: true, number: true, block: true } },
            resident: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!levy) {
      return NextResponse.json({ error: 'Levy not found' }, { status: 404 })
    }

    return NextResponse.json(levy)
  } catch (err: any) {
    console.error('[GET /api/levies/:id]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { levyId: id } }),
      prisma.levy.delete({ where: { id, estateId: resident.estateId } }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/levies/:id]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}