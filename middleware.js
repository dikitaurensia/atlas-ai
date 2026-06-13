import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE = 'atlas_token'

const PUBLIC_ROUTES = ['/login', '/register']

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE)?.value
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  const isValid = await jwtVerify(token, SECRET()).then(() => true).catch(() => false)

  if (isPublic) {
    // Already logged in — skip auth pages
    if (isValid) return NextResponse.redirect(new URL('/analisis', request.url))
    return NextResponse.next()
  }

  // Private route
  if (!isValid) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    if (token) res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/login', '/register', '/analisis/:path*'],
}
