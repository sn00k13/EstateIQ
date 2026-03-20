import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

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

    await prisma.announcement.delete({
      where: { id, estateId: resident.estateId },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[DELETE /api/announcements/:id]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
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

    const { title, body, priority } = await req.json()

    const announcement = await prisma.announcement.update({
      where: { id, estateId: resident.estateId },
      data: {
        title:    title?.trim()  ?? undefined,
        body:     body?.trim()   ?? undefined,
        priority: priority       ?? undefined,
      },
    })

    return NextResponse.json(announcement)
  } catch (err: any) {
    console.error('[PATCH /api/announcements/:id]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}