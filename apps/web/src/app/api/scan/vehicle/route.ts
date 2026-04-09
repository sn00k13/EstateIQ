import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'
import { rateLimit } from '@/lib/rateLimit'

export async function GET(req: Request) {


  const limited = rateLimit(req as any, { limit: 60, windowMs: 60 * 1000 })
  if (limited) return limited
  try {
    const { searchParams } = new URL(req.url)
    const token    = searchParams.get('token')
    const location = searchParams.get('location') ?? null
    const scannedBy = searchParams.get('scannedBy') ?? null

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { scanToken: token },
      include: {
        resident: {
          include: {
            unit: { select: { number: true, block: true } },
          },
        },
        estate: {
          select: { name: true },
        },
      },
    })

    if (!vehicle || !vehicle.isActive) {
      return NextResponse.json(
        {
          outcome:  'BLOCKED',
          reason:   'Unregistered or deactivated vehicle',
          color:    'red',
        },
        { status: 404 }
      )
    }

    // Check outstanding payments for this resident
    const outstanding = await prisma.payment.aggregate({
      where: {
        residentId: vehicle.residentId,
        status:     'PENDING',
        levy: { estateId: vehicle.estateId },
      },
      _sum:   { amount: true },
      _count: { id: true },
    })

    const debtAmount  = outstanding._sum.amount  ?? 0
    const debtCount   = outstanding._count.id    ?? 0
    const isDebtor    = debtAmount > 0

    // Determine outcome
    // Policy: warn if debt < ₦50,000, block if debt >= ₦50,000
    // Estates can customise this threshold later
    const BLOCK_THRESHOLD = 50000
    let outcome: 'GRANTED' | 'WARNING' | 'BLOCKED'
    if (!isDebtor) {
      outcome = 'GRANTED'
    } else if (debtAmount < BLOCK_THRESHOLD) {
      outcome = 'WARNING'
    } else {
      outcome = 'BLOCKED'
    }

    // Log the scan
    await prisma.scanLog.create({
      data: {
        vehicleId: vehicle.id,
        estateId:  vehicle.estateId,
        outcome,
        debtAmount,
        location,
        scannedBy,
      },
    })

    const residentName =
      `${vehicle.resident.firstName} ${vehicle.resident.lastName}`
    const unitLabel = vehicle.resident.unit
      ? `${vehicle.resident.unit.block ? vehicle.resident.unit.block + ', ' : ''}${vehicle.resident.unit.number}`
      : 'No unit'

    return NextResponse.json({
      outcome,
      vehicle: {
        plateNumber: vehicle.plateNumber,
        make:        vehicle.make,
        model:       vehicle.model,
        color:       vehicle.color,
      },
      resident: {
        name:  residentName,
        unit:  unitLabel,
      },
      estate:  vehicle.estate.name,
      debt: {
        amount:    debtAmount,
        invoices:  debtCount,
        formatted: '₦' + debtAmount.toLocaleString('en-NG'),
      },
      message:
        outcome === 'GRANTED' ? `Welcome, ${residentName}. All dues paid.` :
        outcome === 'WARNING'  ? `${residentName} has ₦${debtAmount.toLocaleString('en-NG')} outstanding.` :
        `Entry restricted. ${residentName} owes ₦${debtAmount.toLocaleString('en-NG')} in dues.`,
      scannedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    logger.error('[GET /api/scan/vehicle]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}