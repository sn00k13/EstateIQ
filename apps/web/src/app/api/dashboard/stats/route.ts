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
    if (!resident) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const estateId = resident.estateId

    // Run all queries in parallel for speed
    const [
      totalResidents,
      activeResidents,
      totalUnits,
      openMaintenance,
      inProgressMaintenance,
      visitorsToday,
      activeVisitors,
      pendingPayments,
      totalLevies,
      openIncidents,
      criticalIncidents,
      activePolls,
      upcomingBookings,
      recentAnnouncements,
      recentActivity,
    ] = await Promise.all([

      // Residents
      prisma.resident.count({
        where: { estateId, isActive: true },
      }),
      prisma.resident.count({
        where: { estateId, isActive: true, role: 'RESIDENT' },
      }),

      // Units
      prisma.unit.count({
        where: { estateId },
      }),

      // Maintenance
      prisma.maintenanceRequest.count({
        where: { estateId, status: 'OPEN' },
      }),
      prisma.maintenanceRequest.count({
        where: { estateId, status: 'IN_PROGRESS' },
      }),

      // Visitors today
      prisma.visitor.count({
        where: {
          estateId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.visitor.count({
        where: { estateId, status: 'ARRIVED' },
      }),

      // Payments — outstanding levy invoices
      prisma.payment.count({
        where: {
          status: 'PENDING',
          levy: { estateId },
        },
      }),

      // Total levies
      prisma.levy.count({
        where: { estateId },
      }),

      // Incidents
      prisma.securityIncident.count({
        where: { estateId, resolvedAt: null },
      }),
      prisma.securityIncident.count({
        where: { estateId, resolvedAt: null, severity: 'CRITICAL' },
      }),

      // Active polls
      prisma.poll.count({
        where: { estateId, endsAt: { gt: new Date() } },
      }),

      // Upcoming facility bookings
      prisma.facilityBooking.count({
        where: {
          status: 'CONFIRMED',
          startTime: { gt: new Date() },
          facility: { estateId },
        },
      }),

      // Recent announcements (last 3)
      prisma.announcement.findMany({
        where: { estateId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, priority: true, createdAt: true },
      }),

      // Recent activity feed (last 8 events across all models)
      buildRecentActivity(estateId),
    ])

    // Outstanding dues amount
    const outstandingDues = await prisma.payment.aggregate({
      where: {
        status: 'PENDING',
        levy: { estateId },
      },
      _sum: { amount: true },
    })

    // Collected dues amount
    const collectedDues = await prisma.payment.aggregate({
      where: {
        status: 'PAID',
        levy: { estateId },
      },
      _sum: { amount: true },
    })

    return NextResponse.json({
      residents: {
        total:    totalResidents,
        active:   activeResidents,
        units:    totalUnits,
      },
      maintenance: {
        open:       openMaintenance,
        inProgress: inProgressMaintenance,
        total:      openMaintenance + inProgressMaintenance,
      },
      visitors: {
        today:   visitorsToday,
        arrived: activeVisitors,
      },
      finances: {
        outstanding:       outstandingDues._sum.amount ?? 0,
        collected:         collectedDues._sum.amount   ?? 0,
        pendingInvoices:   pendingPayments,
        totalLevies,
      },
      incidents: {
        open:     openIncidents,
        critical: criticalIncidents,
      },
      polls: {
        active: activePolls,
      },
      bookings: {
        upcoming: upcomingBookings,
      },
      recentAnnouncements,
      recentActivity,
    })
  } catch (err: any) {
    console.error('[GET /api/dashboard/stats]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Builds a unified recent activity feed from multiple tables
async function buildRecentActivity(estateId: string) {
  const [
    announcements,
    visitors,
    maintenance,
    incidents,
    payments,
  ] = await Promise.all([
    prisma.announcement.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { title: true, createdAt: true, priority: true },
    }),
    prisma.visitor.findMany({
      where: { estateId, status: { in: ['ARRIVED', 'EXPECTED'] } },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { name: true, status: true, createdAt: true },
    }),
    prisma.maintenanceRequest.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { title: true, status: true, priority: true, createdAt: true },
    }),
    prisma.securityIncident.findMany({
      where: { estateId },
      orderBy: { createdAt: 'desc' },
      take: 2,
      select: { title: true, severity: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { status: 'PAID', levy: { estateId } },
      orderBy: { paidAt: 'desc' },
      take: 3,
      include: { levy: { select: { title: true } } },
    }),
  ])

  const feed: { type: string; text: string; time: Date; color: string }[] = []

  announcements.forEach(a => feed.push({
    type:  'announcement',
    text:  `New announcement: ${a.title}`,
    time:  a.createdAt,
    color: a.priority === 'URGENT' ? 'red' : a.priority === 'HIGH' ? 'amber' : 'blue',
  }))

  visitors.forEach(v => feed.push({
    type:  'visitor',
    text:  v.status === 'ARRIVED' ? `${v.name} arrived at the gate` : `${v.name} expected as visitor`,
    time:  v.createdAt,
    color: 'green',
  }))

  maintenance.forEach(m => feed.push({
    type:  'maintenance',
    text:  `Maintenance request: ${m.title}`,
    time:  m.createdAt,
    color: m.priority === 'EMERGENCY' ? 'red' : m.priority === 'HIGH' ? 'amber' : 'gray',
  }))

  incidents.forEach(i => feed.push({
    type:  'incident',
    text:  `Security incident reported: ${i.title}`,
    time:  i.createdAt,
    color: i.severity === 'CRITICAL' ? 'red' : i.severity === 'HIGH' ? 'orange' : 'amber',
  }))

  payments.forEach(p => feed.push({
    type:  'payment',
    text:  `Payment received for ${p.levy.title}`,
    time:  p.paidAt ?? p.createdAt,
    color: 'green',
  }))

  // Sort all events by time descending, return latest 8
  return feed
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)
    .map(item => ({ ...item, time: item.time.toISOString() }))
}