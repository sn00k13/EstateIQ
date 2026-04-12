import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/auth-request'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'
import { getPublicAppOrigin } from '@/lib/appUrl'
import { sendOnboardingWelcomeEmail } from '@/lib/email'
import { notifyResident } from '@/lib/notifyResident'
import { isValidNigeriaMobileLocal, sanitizeNigeriaPhoneInput } from '@/lib/nigeriaPhone'

export async function POST(req: Request) {
  const userId = await getAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const authUser = await prisma.authUser.findUnique({
    where: { id: userId },
    select: { email: true },
  })
  const email = authUser?.email
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { estateName, slug, address, firstName, lastName, phone, unitNumber, unitBlock, plan } =
    await req.json()

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
      { status: 400 }
    )
  }

  // Check slug is not taken
  const existing = await prisma.estate.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'That estate URL is already taken' }, { status: 409 })
  }

  const phoneNormalized = typeof phone === 'string' ? sanitizeNigeriaPhoneInput(phone) : ''
  if (phoneNormalized && !isValidNigeriaMobileLocal(phoneNormalized)) {
    return NextResponse.json(
      { error: 'Invalid Nigerian phone number. Use 11 digits (e.g. 08012345678) or leave blank.' },
      { status: 400 }
    )
  }

  try {
    // Run everything in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the estate
      const estate = await tx.estate.create({
        data: { name: estateName, slug, address, plan: plan ?? 'STARTER', subscriptionStatus: plan === 'PROFESSIONAL' ? 'PENDING_PAYMENT' : 'ACTIVE', },
      })

      // 2. Optionally create the first unit (requires a unit number)
      const unitNumberTrim = typeof unitNumber === 'string' ? unitNumber.trim() : ''
      const unit =
        unitNumberTrim.length > 0
          ? await tx.unit.create({
              data: {
                estateId: estate.id,
                number:   unitNumberTrim,
                block:    (typeof unitBlock === 'string' && unitBlock.trim()) || null,
              },
            })
          : null

      // 3. Create the admin resident profile
      const resident = await tx.resident.create({
        data: {
          estateId: estate.id,
          userId,
          unitId:   unit?.id ?? null,
          role:     'ADMIN',
          firstName,
          lastName,
          email,
          phone:    phoneNormalized || null,
        },
      })

      return { estate, unit, resident }
    })

    const estateUrl = `${getPublicAppOrigin()}/${result.estate.slug}`
    sendOnboardingWelcomeEmail({
      to: email,
      firstName: result.resident.firstName,
      estateName: result.estate.name,
      estateUrl,
    }).catch(err => {
      logger.error('[POST /api/onboarding] Welcome email failed', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    })

    notifyResident(result.resident.id, {
      type: 'welcome',
      title: 'Welcome to Kynjo.Homes',
      body:
        plan === 'PROFESSIONAL'
          ? `${result.estate.name} is set up on Professional. Finish payment to unlock Professional features — you can also complete this anytime from Billing.`
          : `${result.estate.name} is ready. Open your estate page or dashboard to explore announcements, levies, visitors, and more.`,
      href: `/${result.estate.slug}`,
    }).catch(err => {
      logger.error('[POST /api/onboarding] Welcome notification failed', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/onboarding]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}