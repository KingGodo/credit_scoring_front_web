import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES  = ['/login']
const ADMIN_ROUTES   = ['/admin']
const OFFICER_ROUTES = ['/officer']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  // Read token from cookie
  const token = request.cookies.get('token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Read role from cookie for route protection
  const role = request.cookies.get('role')?.value

  // Admin trying to access officer routes or vice versa
  if (pathname.startsWith('/admin') && role !== 'admin') {
    const redirect = role === 'loan_officer' ? '/officer' : '/login'
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  if (pathname.startsWith('/officer') && role !== 'loan_officer') {
    const redirect = role === 'admin' ? '/admin' : '/login'
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
}