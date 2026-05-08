import { NextRequest, NextResponse } from 'next/server'

function decodePayload(token: string): { role: string } | null {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(b64))
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

  if (!token) return redirect(req, '/login')

  const payload = decodePayload(token)
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
