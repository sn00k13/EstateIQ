import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'

/** Admin: rotate resident ID card QR token (invalidates printed cards). */
export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.resident.findUnique({
      where: { userId },
    })
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { nanoid } = await import('nanoid')
    const resident = await prisma.resident.update({
      where: { id, estateId: admin.estateId },
      data: { residentScanToken: nanoid(24) },
      include: { unit: true },
    })

    return NextResponse.json(resident)
  } catch (err: unknown) {
    logger.error('[POST /api/residents/:id/rotate-qr]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
