import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'
import { sendInviteEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.resident.findUnique({
      where: { userId: session.user.id },
      include: { estate: true },
    })
    if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { residentId } = await req.json()
    if (!residentId) {
      return NextResponse.json({ error: 'residentId is required' }, { status: 400 })
    }

    const resident = await prisma.resident.findFirst({
      where: { id: residentId, estateId: admin.estateId },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    // Check if their AuthUser already has a password set
    const authUser = await prisma.authUser.findUnique({
      where: { email: resident.email },
    })
    if (authUser?.passwordHash) {
      return NextResponse.json(
        { error: 'This resident has already set up their account.' },
        { status: 409 }
      )
    }

    // Invalidate any existing unused tokens for this email
    await prisma.inviteToken.updateMany({
      where: { email: resident.email, usedAt: null },
      data:  { expiresAt: new Date() }, // expire them immediately
    })

    // Generate a new secure token
    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    await prisma.inviteToken.create({
      data: {
        token,
        email:      resident.email,
        estateId:   admin.estateId,
        residentId: resident.id,
        expiresAt,
      },
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL}/accept-invite?token=${token}`

    await sendInviteEmail({
      to:          resident.email,
      firstName:   resident.firstName,
      estateName:  admin.estate.name,
      inviteUrl,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[POST /api/residents/invite]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}