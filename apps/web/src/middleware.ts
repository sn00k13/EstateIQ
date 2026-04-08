import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getAuthSecretKey, WEB_SESSION_COOKIE } from '@/lib/auth-cookie'

const publicPaths = [
  '/',
  '/sign-in',
  '/login-test',
  '/sign-up',
  '/api/auth',
  '/api/webhooks',
  '/api/mobile/auth',
  '/accept-invite',
  '/api/residents/accept-invite',
  '/api/scan',
  '/api/estate',
  '/terms',
  '/privacy',
  '/api/health',
  '/forgot-password',
  '/reset-password',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/pricing',
  '/subscribe',
  '/api/subscription',
]

const dashboardRoutes = [
  '/dashboard',
  '/residents',
  '/announcements',
  '/levies',
  '/visitors',
  '/maintenance',
  '/facilities',
  '/polls',
  '/incidents',
  '/vehicles',
  '/onboarding',
]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  if (pathname === '/') {
    return NextResponse.next()
  }

  const isDashboard = dashboardRoutes.some(r => pathname.startsWith(r))
  const segments = pathname.split('/').filter(Boolean)
  const isEstateLanding = segments.length === 1 && !isDashboard
  if (isEstateLanding) {
    return NextResponse.next()
  }

  const mobileToken = req.headers.get('x-mobile-session')
  if (mobileToken) {
    try {
      await jwtVerify(mobileToken, getAuthSecretKey())
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: 'Invalid mobile session' }, { status: 401 })
    }
  }

  const webToken = req.cookies.get(WEB_SESSION_COOKIE)?.value
  let webOk = false
  if (webToken) {
    try {
      await jwtVerify(webToken, getAuthSecretKey())
      webOk = true
    } catch {
      webOk = false
    }
  }

  if (!webOk) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const signInUrl = new URL('/sign-in', req.nextUrl)
    signInUrl.searchParams.set('callbackUrl', pathname + req.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
