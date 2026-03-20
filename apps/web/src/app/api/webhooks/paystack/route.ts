import { NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'
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
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[POST /api/webhooks/paystack]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}