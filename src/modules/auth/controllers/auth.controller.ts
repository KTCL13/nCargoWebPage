import { NextRequest, NextResponse } from 'next/server'
import { authService } from '../services/auth.service'
import { getIp } from '@/lib/get-ip'
import { getAuthEmployee } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limiter'

function rateLimited(bucket: string, identifier: string, limit: number, windowMs: number) {
    const r = rateLimit({ bucket, identifier, limit, windowMs })
    if (r.allowed) return null
    return NextResponse.json(
        { message: 'Demasiados intentos. Intenta de nuevo más tarde.' },
        { status: 429, headers: { 'Retry-After': String(r.retryAfterSeconds) } },
    )
}

class AuthController {
    async register(req: NextRequest) {
        const limited = rateLimited('register', getIp(req), 5, 60 * 60_000)
        if (limited) return limited
        try {
            const body = await req.json()
            const result = await authService.register(body)
            return NextResponse.json(result, { status: 201 })
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async login(req: NextRequest) {
        const ip = getIp(req)
        const limited = rateLimited('login', ip, 10, 15 * 60_000)
        if (limited) return limited
        try {
            const body = await req.json()
            const userAgent = req.headers.get('user-agent') ?? undefined
            const result = await authService.login(body, ip, userAgent)

            const response = NextResponse.json(result, { status: 200 })
            response.cookies.set('token', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24,
                path: '/',
            })
            return response
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async logout(req: NextRequest) {
        try {
            const employee = getAuthEmployee(req)
            await authService.logout(employee.id)
            return new NextResponse(null, { status: 204 })
        } catch (error) {
            const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async forgotPassword(req: NextRequest) {
        const limited = rateLimited('forgot-password', getIp(req), 5, 60 * 60_000)
        if (limited) return limited
        try {
            const body = await req.json()
            await authService.forgotPassword(body)
            return NextResponse.json(
                { message: 'Si el email existe, recibirás un enlace de recuperación.' },
                { status: 200 }
            )
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }

    async resetPassword(req: NextRequest) {
        const limited = rateLimited('reset-password', getIp(req), 10, 60 * 60_000)
        if (limited) return limited
        try {
            const body = await req.json()
            await authService.resetPassword(body)
            return NextResponse.json(
                { message: 'Contraseña actualizada correctamente.' },
                { status: 200 }
            )
        } catch (error) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 }
            )
        }
    }
}

export const authController = new AuthController()
