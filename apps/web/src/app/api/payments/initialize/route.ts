import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId } = await req.json()
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, residentId: resident.id },
      include: { levy: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (payment.status === 'PAID') {
      return NextResponse.json({ error: 'This levy has already been paid' }, { status: 400 })
    }

    // Call Paystack initialize endpoint directly
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:     resident.email,
        amount:    payment.amount * 100, // Paystack uses kobo
        currency:  'NGN',
        reference: `estateiq_${payment.id}_${Date.now()}`,
        metadata: {
          paymentId: payment.id,
          levyId:    payment.levyId,
          residentId: resident.id,
          levyTitle:  payment.levy.title,
        },
        callback_url: `${process.env.NEXTAUTH_URL}/dashboard/levies?payment=success`,
      }),
    })

    const data = await paystackRes.json()

    if (!data.status) {
      return NextResponse.json(
        { error: data.message ?? 'Paystack initialization failed' },
        { status: 500 }
      )
    }

    // Store the reference on the payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: { reference: data.data.reference },
    })

    return NextResponse.json({ authorizationUrl: data.data.authorization_url })
  } catch (err) {
    console.error('[POST /api/payments/initialize]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}