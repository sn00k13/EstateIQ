import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@estateiq/database'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ available: false, error: 'Slug required' }, { status: 400 })
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ available: false })
  }

  const existing = await prisma.estate.findUnique({ where: { slug } })
  return NextResponse.json({ available: !existing })
}
