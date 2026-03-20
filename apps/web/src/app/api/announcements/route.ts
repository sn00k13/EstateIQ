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

    const announcements = await prisma.announcement.findMany({
      where: { estateId: resident.estateId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(announcements)
  } catch (err) {
    console.error('[GET /api/announcements]', err)
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

    const { title, body, priority } = await req.json()

    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    const announcement = await prisma.announcement.create({
      data: {
        estateId: resident.estateId,
        title: title.trim(),
        body: body.trim(),
        priority: priority ?? 'NORMAL',
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (err) {
    console.error('[POST /api/announcements]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}