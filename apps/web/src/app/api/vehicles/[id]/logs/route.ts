import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, estateId: resident.estateId },
      select: { residentId: true },
    })
    if (!vehicle) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const isEstateAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(resident.role)
    if (!isEstateAdmin && vehicle.residentId !== resident.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const logs = await prisma.scanLog.findMany({
      where: { vehicleId: id, estateId: resident.estateId },
      orderBy: { scannedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(logs)
  } catch (err: any) {
    logger.error('[GET /api/vehicles/:id/logs]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}