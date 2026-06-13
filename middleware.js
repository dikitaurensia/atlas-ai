import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE = 'atlas_token'

export async function middleware(request) {
  const token = request.cookies.get(COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, SECRET())
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.set(COOKIE, '', { maxAge: 0, path: '/' })
    return res
  }
}

export const config = {
  matcher: ['/analisis/:path*'],
}
