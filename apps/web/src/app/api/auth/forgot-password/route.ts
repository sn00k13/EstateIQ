import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import { sendPasswordResetEmail } from '@/lib/email'
import { getPublicAppOrigin } from '@/lib/appUrl'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    let body: { email?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const email = body.email
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const authUser = await prisma.authUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    // Always return success even if email not found — prevents user enumeration
    if (!authUser) {
      return NextResponse.json({ success: true })
    }

    // Expire any existing reset tokens
    await prisma.inviteToken.updateMany({
      where: { email: authUser.email, usedAt: null },
      data:  { expiresAt: new Date() },
    })

    const token     = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour only

    await prisma.inviteToken.create({
      data: {
        token,
        email:      authUser.email,
        estateId:   'password-reset', // sentinel value
        residentId: 'password-reset',
        expiresAt,
      },
    })

    const origin =
      process.env.NEXTAUTH_URL?.replace(/\/$/, '') || getPublicAppOrigin()
    const resetUrl = `${origin}/reset-password?token=${token}`

    try {
      await sendPasswordResetEmail({
        to:       authUser.email,
        name:     authUser.name ?? 'User',
        resetUrl,
      })
    } catch (emailErr: unknown) {
      // Never surface 500 here — same response as unknown email (enumeration-safe).
      logger.error('[POST /api/auth/forgot-password] email send failed', {
        message: emailErr instanceof Error ? emailErr.message : String(emailErr),
        stack:   emailErr instanceof Error ? emailErr.stack : undefined,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    logger.error('[POST /api/auth/forgot-password]', { message: err.message, stack: err.stack })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
