import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

type JwtPayload = { id: number; email: string; role: string }

function verifyToken(token: string): JwtPayload | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  try {
    return jwt.verify(token, secret) as JwtPayload
  } catch {
    return null
  }
}

function redirect(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, req.url))
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get('token')?.value
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/api') || pathname === '/login') {
    return NextResponse.next()
  }

  if (!token) return redirect(req, '/login')

  const payload = verifyToken(token)
  if (!payload) return redirect(req, '/login')

  if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
    return redirect(req, '/employee/jornada')
  }

  if (pathname.startsWith('/employee') && payload.role !== 'EMPLOYEE') {
    return redirect(req, '/admin/dashboard')
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/employee/:path*'],
}
