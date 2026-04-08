import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
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

    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const estateId = resident.estateId
    const isResidentOnly = resident.role === 'RESIDENT'
    const isAdminRole = resident.role === 'ADMIN' || resident.role === 'SUPER_ADMIN'
    const maintenanceScope = isResidentOnly
      ? { estateId, submittedBy: resident.id }
      : { estateId }
    const visitorScope = isResidentOnly
      ? { estateId, residentId: resident.id }
      : { estateId }
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0))

    const [
      totalResidents,
      activeResidents,
      totalUnits,
      occupiedUnits,
      levies,
      payments,
      pendingMaintenance,
      openIncidents,
      visitorsToday,
      activePolls,
      recentAnnouncements,
      recentMaintenance,
      recentVisitors,
    ] = await Promise.all([
      prisma.resident.count({
        where: { estateId },
      }),
      prisma.resident.count({
        where: { estateId, isActive: true },
      }),
      prisma.unit.count({
        where: { estateId },
      }),
      prisma.unit.count({
        where: { estateId, residents: { some: { isActive: true } } },
      }),
      prisma.levy.findMany({
        where: { estateId },
        select: { id: true, amount: true },
      }),
      prisma.payment.findMany({
        where: { levy: { estateId } },
        select: { status: true, amount: true },
      }),
      prisma.maintenanceRequest.count({
        where: {
          ...maintenanceScope,
          status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
        },
      }),
      prisma.securityIncident.count({
        where: { estateId, resolvedAt: null },
      }),
      prisma.visitor.count({
        where: {
          ...visitorScope,
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.poll.count({
        where: {
          estateId,
          endsAt: { gt: new Date() },
        },
      }),
      isAdminRole
        ? prisma.announcement.findMany({
            where:   { estateId },
            orderBy: { createdAt: 'desc' },
            take:    3,
            select:  { id: true, title: true, createdAt: true },
          })
        : Promise.resolve([] as { id: string; title: string; createdAt: Date }[]),
      prisma.maintenanceRequest.findMany({
        where:   maintenanceScope,
        orderBy: { createdAt: 'desc' },
        take:    3,
        select:  { id: true, title: true, createdAt: true, status: true },
      }),
      prisma.visitor.findMany({
        where:   visitorScope,
        orderBy: { createdAt: 'desc' },
        take:    3,
        select:  { id: true, name: true, createdAt: true, status: true },
      }),
    ])

    const residentPendingPayments = isResidentOnly
      ? await prisma.payment.aggregate({
          where: {
            ...viewerPaymentsWhere(estateId, resident),
            status: 'PENDING',
          },
          _sum: { amount: true },
        })
      : null

    const totalLevies = levies.length
    const paidPayments = payments.filter(p => p.status === 'PAID')
    const totalCollected = paidPayments.reduce((s, p) => s + p.amount, 0)
    const totalExpected = levies.reduce((s, l) => s + l.amount * totalUnits, 0)

    let totalOutstanding: number
    let collectionRate: number

    if (isResidentOnly && residentPendingPayments) {
      totalOutstanding = residentPendingPayments._sum.amount ?? 0
      collectionRate = 0
    } else {
      totalOutstanding = totalExpected - totalCollected
      collectionRate =
        totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
    }

    const announcementItems = isAdminRole
      ? recentAnnouncements.map(a => ({
          id:        a.id,
          type:      'announcement',
          message:   `New announcement: ${a.title}`,
          createdAt: a.createdAt.toISOString(),
        }))
      : []

    const recentActivity = [
      ...announcementItems,
      ...recentMaintenance.map(m => ({
        id:        m.id,
        type:      'maintenance',
        message:   `Maintenance request: ${m.title} — ${m.status.toLowerCase()}`,
        createdAt: m.createdAt.toISOString(),
      })),
      ...recentVisitors.map(v => ({
        id:        v.id,
        type:      'visitor',
        message:   `Visitor ${v.name} — ${v.status.toLowerCase()}`,
        createdAt: v.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    return NextResponse.json({
      totalResidents,
      activeResidents,
      totalUnits,
      occupiedUnits,
      totalLevies,
      totalCollected,
      totalOutstanding,
      collectionRate,
      pendingMaintenance,
      openIncidents,
      visitorsToday,
      activePolls,
      recentActivity,
    })
  } catch (err: any) {
    console.error('[GET /api/dashboard/stats]', err.message, err.stack)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}