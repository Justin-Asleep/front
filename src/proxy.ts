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
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api|health).*)',],
}
