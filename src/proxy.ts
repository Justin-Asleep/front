import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('access_token')?.value
  const isAuthRoute = pathname.startsWith('/login')
  // /tablet uses device_token (localStorage), not user cookie auth
  const isPublicRoute = pathname === '/tablet' || pathname.startsWith('/tablet/')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  if (!token && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/select', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Skip auth guard for: Next internals, API routes, health probe,
  // and any static asset identifiable by file extension (manifests,
  // service worker, icons, fonts, etc.) served from /public.
  matcher: [
    '/((?!_next/static|_next/image|api|health|favicon\\.ico|.*\\.(?:webmanifest|png|jpg|jpeg|gif|webp|svg|ico|js|css|json|map|woff|woff2|ttf|eot|txt|xml)).*)',
  ],
}
