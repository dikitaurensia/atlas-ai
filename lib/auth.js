import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

export const COOKIE = 'atlas_token'
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export const hashPassword = (plain) => bcrypt.hash(plain, 10)
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash)

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret())
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, secret())
  return payload
}

export function cookieOpts(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  }
}
