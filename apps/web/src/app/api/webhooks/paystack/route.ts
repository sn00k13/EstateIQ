import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
import { logger } from '@/lib/logger'
import { notifyResident } from '@/lib/notifyResident'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const body      = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify the webhook is genuinely from Paystack
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event === 'charge.success') {
      const reference = event.data.reference as string

      const payment = await prisma.payment.findUnique({
        where: { reference },
      })

      if (payment && payment.status !== 'PAID') {
        await prisma.payment.update({
          where: { reference },
          data: {
            status: 'PAID',
            paidAt: new Date(event.data.paid_at ?? Date.now()),
          },
        })
      }

      // Handle subscription payments
    if (event.data?.metadata?.type === 'subscription') {
      const { estateId } = event.data.metadata
      if (estateId) {
        const estateBefore = await prisma.estate.findUnique({
          where: { id: estateId },
          select: { subscriptionStatus: true, name: true, slug: true },
        })

        const now       = new Date()
        const expiresAt = new Date(now)
        expiresAt.setFullYear(expiresAt.getFullYear() + 1) // 1 year from now

        await prisma.estate.update({
          where: { id: estateId },
          data: {
            plan:                  'PROFESSIONAL',
            subscriptionStatus:    'ACTIVE',
            subscriptionStartedAt: now,
            subscriptionExpiresAt: expiresAt,
          },
        })

        if (estateBefore?.subscriptionStatus === 'PENDING_PAYMENT') {
          const admins = await prisma.resident.findMany({
            where: {
              estateId,
              role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            },
            select: { id: true },
          })
          const estateName = estateBefore.name
          const href = estateBefore.slug ? `/${estateBefore.slug}` : '/dashboard'
          await Promise.all(
            admins.map((r) =>
              notifyResident(r.id, {
                type: 'subscription_activated',
                title: 'Professional activation successful',
                body: `${estateName} is now on Professional. Your subscription is active for 12 months — all features are unlocked.`,
                href,
              }).catch((err) => {
                logger.error('[POST /api/webhooks/paystack] Activation notification failed', {
                  residentId: r.id,
                  message: err instanceof Error ? err.message : String(err),
                })
              })
            )
          )
        }
      }
    }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('[POST /api/webhooks/paystack]', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}