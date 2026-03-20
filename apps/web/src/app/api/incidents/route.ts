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

    const incidents = await prisma.securityIncident.findMany({
      where: { estateId: resident.estateId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(incidents)
  } catch (err: any) {
    console.error('[GET /api/incidents]', err.message)
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

    const { title, description, severity, location } = await req.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const incident = await prisma.securityIncident.create({
      data: {
        estateId:    resident.estateId,
        title:       title.trim(),
        description: description.trim(),
        severity:    severity  ?? 'LOW',
        location:    location?.trim() || null,
        mediaUrls:   [],
        reportedBy:  resident.id,
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/incidents]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}