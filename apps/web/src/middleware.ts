import { auth } from '@/lib/auth'
import { NextResponse, NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET!)

const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/api/auth',
  '/api/webhooks',
  '/api/mobile/auth',
  '/accept-invite',
  '/api/residents/accept-invite',
]

export default async function middleware(req: NextRequest) {
  const isPublic = publicRoutes.some(r => req.nextUrl.pathname.startsWith(r))
  if (isPublic) return NextResponse.next()

  // Mobile JWT path
  const mobileToken = req.headers.get('x-mobile-session')
  if (mobileToken) {
    try {
      await jwtVerify(mobileToken, SECRET)
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: 'Invalid mobile session' }, { status: 401 })
    }
  }

  // Web session path
  return (auth as any)(req)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}