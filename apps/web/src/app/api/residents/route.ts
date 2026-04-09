import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
import { sendInviteEmail } from '@/lib/email'
import crypto from 'crypto'
import { getPaginationParams, paginate } from '@/lib/paginate'
import { rowToCsvLine } from '@/lib/csv'
import { logger } from '@/lib/logger'
import { getPublicAppOrigin } from '@/lib/appUrl'
import { assertCanAddResident } from '@/lib/estatePlanEnforcement'


export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.resident.findUnique({
      where: { userId },
    })

    if (!admin) {
      return NextResponse.json([])
    }

    const { searchParams } = new URL(req.url)
    const where = { estateId: admin.estateId }
    const isEstateAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(admin.role)

    if (searchParams.get('format') === 'csv') {
      if (!isEstateAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const rows = await prisma.resident.findMany({
        where,
        include: { unit: true },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      })
      const header = rowToCsvLine([
        'First name',
        'Last name',
        'Email',
        'Phone',
        'Unit',
        'Role',
        'Status',
        'Joined',
      ])
      const lines = rows.map((r) => {
        const unit =
          r.unit != null
            ? `${r.unit.block ? `${r.unit.block}, ` : ''}${r.unit.number}`.trim()
            : ''
        return rowToCsvLine([
          r.firstName,
          r.lastName,
          r.email,
          r.phone ?? '',
          unit,
          r.role,
          r.isActive ? 'Active' : 'Inactive',
          new Date(r.joinedAt).toISOString().slice(0, 10),
        ])
      })
      const csv = '\uFEFF' + [header, ...lines].join('\r\n')
      const stamp = new Date().toISOString().slice(0, 10)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="members-export-${stamp}.csv"`,
        },
      })
    }

    if (searchParams.get('all') === '1') {
      if (!isEstateAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const residents = await prisma.resident.findMany({
        where,
        include: { unit: true },
        orderBy: { joinedAt: 'desc' },
      })
      const total = residents.length
      return NextResponse.json({
        data:       residents,
        total,
        page:       1,
        totalPages: 1,
        hasMore:    false,
      })
    }

    const { page, limit } = getPaginationParams(req.url)

    const [residents, total] = await Promise.all([
      prisma.resident.findMany({
        where,
        include: { unit: true },
        orderBy: { joinedAt: 'desc' },
        ...paginate(page, limit),
      }),
      prisma.resident.count({ where }),
    ])

    return NextResponse.json({
      data:       residents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore:    page * limit < total,
    })
  } catch (err: any) {
    logger.error('[GET /api/residents]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.resident.findUnique({
      where: { userId },
      include: { estate: true },
    })

    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, unitId, role } = body

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name and email are required' },
        { status: 400 }
      )
    }

    const existing = await prisma.resident.findFirst({
      where: { estateId: admin.estateId, email: email.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'A resident with this email already exists' },
        { status: 409 }
      )
    }

    const cap = await assertCanAddResident(prisma, admin.estateId)
    if (!cap.ok) {
      return NextResponse.json({ error: cap.message }, { status: 403 })
    }

    let authUser = await prisma.authUser.findUnique({
      where: { email: email.trim() },
    })
    if (!authUser) {
      authUser = await prisma.authUser.create({
        data: { email: email.trim(), name: `${firstName.trim()} ${lastName.trim()}` },
      })
    }

    const resident = await prisma.resident.create({
      data: {
        estateId:  admin.estateId,
        userId:    authUser.id,
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim(),
        phone:     phone?.trim() || null,
        unitId:    unitId || null,
        role:      role || 'RESIDENT',
      },
      include: { unit: true },
    })

    // Generate invite token
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await prisma.inviteToken.create({
      data: {
        token,
        email:      email.trim(),
        estateId:   admin.estateId,
        residentId: resident.id,
        expiresAt,
      },
    })

    const inviteUrl = `${getPublicAppOrigin()}/accept-invite?token=${token}`

    // Fire and forget — don't await, don't block the response
    sendInviteEmail({
      to:         email.trim(),
      firstName:  firstName.trim(),
      estateName: admin.estate.name,
      inviteUrl,
    }).catch(err => {
      logger.error('[Background email failed]', { message: err.message, stack: err.stack })
    })

    return NextResponse.json(resident, { status: 201 })
  } catch (err: any) {
    logger.error('[POST /api/residents]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}