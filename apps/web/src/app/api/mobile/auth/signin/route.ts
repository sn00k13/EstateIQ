import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!)

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const authUser = await prisma.authUser.findUnique({ where: { email } })
    if (!authUser || !authUser.passwordHash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, authUser.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: authUser.id },
      include: { unit: { select: { number: true, block: true } } },
    })
    if (!resident) {
      return NextResponse.json(
        { error: 'No estate profile found. Please complete onboarding on the web.' },
        { status: 403 }
      )
    }

    // Issue a JWT valid for 30 days
    const token = await new SignJWT({
      sub:        authUser.id,
      residentId: resident.id,
      estateId:   resident.estateId,
      role:       resident.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(SECRET)

    return NextResponse.json({
      token,
      resident: {
        id:        resident.id,
        firstName: resident.firstName,
        lastName:  resident.lastName,
        email:     resident.email,
        role:      resident.role,
        estateId:  resident.estateId,
        unit:      resident.unit,
      },
    })
  } catch (err: any) {
    console.error('[POST /api/mobile/auth/signin]', err.message)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}