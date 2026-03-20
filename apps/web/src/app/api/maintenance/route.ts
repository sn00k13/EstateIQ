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

    // Admins see all requests; residents see only their own
    const where = ['ADMIN', 'SUPER_ADMIN'].includes(resident.role)
      ? { estateId: resident.estateId }
      : { estateId: resident.estateId, submittedBy: resident.id }

    const requests = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(requests)
  } catch (err) {
    console.error('[GET /api/maintenance]', err)
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
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const { title, description, category, priority, mediaUrls } = await req.json()

    if (!title?.trim() || !description?.trim() || !category?.trim()) {
      return NextResponse.json(
        { error: 'Title, description and category are required' },
        { status: 400 }
      )
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        estateId:    resident.estateId,
        title:       title.trim(),
        description: description.trim(),
        category:    category.trim(),
        priority:    priority ?? 'MEDIUM',
        status:      'OPEN',
        submittedBy: resident.id,
        mediaUrls:   mediaUrls ?? [],
      },
    })

    return NextResponse.json(request, { status: 201 })
  } catch (err) {
    console.error('[POST /api/maintenance]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}