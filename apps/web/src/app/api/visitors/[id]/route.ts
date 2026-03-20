import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

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
    if (!resident) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { status } = await req.json()

    const visitor = await prisma.visitor.update({
      where: { id, estateId: resident.estateId },
      data: { status },
    })

    return NextResponse.json(visitor)
  } catch (err: any) {
    console.error('[PATCH /api/visitors/:id]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}