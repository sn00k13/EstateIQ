import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'

/** Gate scan: resolve resident ID card QR token (same debt policy as vehicle scan). */
export async function GET(req: Request) {
  const limited = rateLimit(req as any, { limit: 60, windowMs: 60 * 1000 })
  if (limited) return limited
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const location = searchParams.get('location') ?? null
    const scannedBy = searchParams.get('scannedBy') ?? null

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const resident = await prisma.resident.findUnique({
      where: { residentScanToken: token },
      include: {
        unit: { select: { number: true, block: true } },
        estate: { select: { name: true } },
      },
    })

    if (!resident || !resident.isActive) {
      return NextResponse.json(
        {
          error: 'Invalid or inactive resident',
          outcome: 'BLOCKED',
          reason: 'Invalid or inactive resident',
          color: 'red',
        },
        { status: 404 }
      )
    }

    const outstanding = await prisma.payment.aggregate({
      where: {
        residentId: resident.id,
        status: 'PENDING',
        levy: { estateId: resident.estateId },
      },
      _sum: { amount: true },
      _count: { id: true },
    })

    const debtAmount = outstanding._sum.amount ?? 0
    const debtCount = outstanding._count.id ?? 0
    const isDebtor = debtAmount > 0

    const BLOCK_THRESHOLD = 50000
    let outcome: 'GRANTED' | 'WARNING' | 'BLOCKED'
    if (!isDebtor) {
      outcome = 'GRANTED'
    } else if (debtAmount < BLOCK_THRESHOLD) {
      outcome = 'WARNING'
    } else {
      outcome = 'BLOCKED'
    }

    await prisma.scanLog.create({
      data: {
        residentId: resident.id,
        estateId: resident.estateId,
        outcome,
        debtAmount,
        location,
        scannedBy,
        vehicleId: null,
      },
    })

    const residentName = `${resident.firstName} ${resident.lastName}`
    const unitLabel = resident.unit
      ? `${resident.unit.block ? resident.unit.block + ', ' : ''}${resident.unit.number}`
      : 'No unit'
    const roleLabel =
      resident.role.charAt(0) + resident.role.slice(1).toLowerCase().replace(/_/g, ' ')

    return NextResponse.json({
      outcome,
      resident: {
        name: residentName,
        unit: unitLabel,
        role: roleLabel,
      },
      estate: resident.estate.name,
      debt: {
        amount: debtAmount,
        invoices: debtCount,
        formatted: '₦' + debtAmount.toLocaleString('en-NG'),
      },
      message:
        outcome === 'GRANTED'
          ? `Verified: ${residentName}. All dues paid.`
          : outcome === 'WARNING'
            ? `${residentName} has ₦${debtAmount.toLocaleString('en-NG')} outstanding.`
            : `Entry restricted. ${residentName} owes ₦${debtAmount.toLocaleString('en-NG')} in dues.`,
      scannedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    logger.error('[GET /api/scan/resident]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
