import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@estateiq/database'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!pollId) {
      return NextResponse.json({ error: 'Poll ID is missing' }, { status: 400 })
    }

    const resident = await prisma.resident.findUnique({
      where: { userId: session.user.id },
    })
    if (!resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    const body = await req.json()
    const optionIndex = parseInt(String(body.optionIndex), 10)

    if (isNaN(optionIndex)) {
      return NextResponse.json({ error: 'optionIndex must be a number' }, { status: 400 })
    }

    const poll = await prisma.poll.findFirst({
      where: { id: pollId, estateId: resident.estateId },
    })

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 })
    }

    if (new Date(poll.endsAt) < new Date()) {
      return NextResponse.json({ error: 'This poll has ended' }, { status: 400 })
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return NextResponse.json(
        { error: `Invalid option. Must be between 0 and ${poll.options.length - 1}` },
        { status: 400 }
      )
    }

    const existing = await prisma.vote.findUnique({
      where: {
        pollId_residentId: {
          pollId,
          residentId: resident.id,
        },
      },
    })

    const vote = existing
      ? await prisma.vote.update({
          where: {
            pollId_residentId: {
              pollId,
              residentId: resident.id,
            },
          },
          data: { optionIndex },
        })
      : await prisma.vote.create({
          data: {
            pollId,
            residentId:  resident.id,
            optionIndex,
          },
        })

    return NextResponse.json(vote, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/polls/:id/vote]', err.message, err.meta)
    return NextResponse.json(
      { error: err.message ?? 'Internal server error' },
      { status: 500 }
    )
  }
}