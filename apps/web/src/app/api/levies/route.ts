import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'
import { viewerPaymentsWhere } from '@/lib/viewerPaymentsWhere'

export async function GET() {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId },
    })
    if (!resident) return NextResponse.json([])

    const isEstateAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(resident.role)

    if (isEstateAdmin) {
      const levies = await prisma.levy.findMany({
        where: { estateId: resident.estateId },
        include: {
          payments: { select: { status: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      const enriched = levies.map(levy => {
        const rows = levy.payments
        const total   = rows.length
        const paid    = rows.filter(p => p.status === 'PAID').length
        const pending = rows.filter(p => p.status === 'PENDING').length
        const amountCollected = rows
          .filter(p => p.status === 'PAID')
          .reduce((sum, p) => sum + p.amount, 0)
        const pendingAmount = rows
          .filter(p => p.status === 'PENDING')
          .reduce((sum, p) => sum + p.amount, 0)
        return {
          ...levy,
          payments: undefined,
          _count: { total, paid, pending },
          amountCollected,
          pendingAmount,
        }
      })
      return NextResponse.json(enriched)
    }

    const levies = await prisma.levy.findMany({
      where: { estateId: resident.estateId },
      orderBy: { createdAt: 'desc' },
    })

    const viewerPayments = await prisma.payment.findMany({
      where: viewerPaymentsWhere(resident.estateId, resident),
      select: { levyId: true, status: true, amount: true },
    })

    const viewerPaymentsByLevy = new Map<string, { status: string; amount: number }[]>()
    for (const p of viewerPayments) {
      const list = viewerPaymentsByLevy.get(p.levyId) ?? []
      list.push({ status: p.status, amount: p.amount })
      viewerPaymentsByLevy.set(p.levyId, list)
    }

    const enriched = levies.map(levy => {
      const rows = viewerPaymentsByLevy.get(levy.id) ?? []
      const total   = rows.length
      const paid    = rows.filter(p => p.status === 'PAID').length
      const pending = rows.filter(p => p.status === 'PENDING').length
      const amountCollected = rows
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0)
      const pendingAmount = rows
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0)

      return {
        ...levy,
        payments: undefined,
        _count: { total, paid, pending },
        amountCollected,
        pendingAmount,
      }
    })

    return NextResponse.json(enriched)
  } catch (err) {
    logger.error('[GET /api/levies]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId },
    })
    if (!resident || !['ADMIN', 'SUPER_ADMIN'].includes(resident.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, description, amount, dueDate } = await req.json()

    if (!title?.trim() || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Title, amount and due date are required' },
        { status: 400 }
      )
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    // Get all active units in the estate
    const units = await prisma.unit.findMany({
      where: { estateId: resident.estateId },
    })

    if (units.length === 0) {
      return NextResponse.json(
        { error: 'No units found. Add units before creating a levy.' },
        { status: 400 }
      )
    }

    // Create levy + auto-generate one payment invoice per unit
    const levy = await prisma.$transaction(async (tx) => {
      const newLevy = await tx.levy.create({
        data: {
          estateId:    resident.estateId,
          title:       title.trim(),
          description: description?.trim() || null,
          amount:      Number(amount),
          dueDate:     new Date(dueDate),
        },
      })

      // Find the resident assigned to each unit (if any)
      const unitResidents = await tx.resident.findMany({
        where: {
          estateId: resident.estateId,
          unitId: { in: units.map(u => u.id) },
          isActive: true,
        },
        select: { id: true, unitId: true },
      })

      const residentByUnit = Object.fromEntries(
        unitResidents.map(r => [r.unitId!, r.id])
      )

      // Create a payment record for every unit
      await tx.payment.createMany({
        data: units.map(unit => ({
          levyId:     newLevy.id,
          unitId:     unit.id,
          residentId: residentByUnit[unit.id] ?? resident.id,
          amount:     Number(amount),
          status:     'PENDING',
        })),
      })

      return newLevy
    })

    return NextResponse.json(levy, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/levies]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}