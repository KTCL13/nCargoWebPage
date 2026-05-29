import { NextRequest } from 'next/server'
import { jwtService, JwtPayload } from '@/modules/auth/services/jwt.service'
import { prisma } from '@/lib/prisma'

export type AuthEmployee = { id: number; email: string; role: string; jti: string }

export async function getAuthEmployee(req: NextRequest): Promise<AuthEmployee> {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Token no proporcionado')
    }

    const token = authHeader.slice(7)
    const payload = jwtService.verify(token) as JwtPayload

    // Validate that the session is still active (covers eviction and explicit logout)
    if (payload.jti) {
        const session = await prisma.userSession.findFirst({
            where: { tokenJti: payload.jti, logoutAt: null },
            select: { id: true },
        })
        if (!session) throw new Error('Sesión inválida o expirada')
    }

    return { id: payload.id, email: payload.email, role: payload.role, jti: payload.jti }
}

export async function requireAdmin(req: NextRequest): Promise<AuthEmployee> {
    const employee = await getAuthEmployee(req)
    if (employee.role !== 'ADMIN') {
        throw new Error('Forbidden: se requiere rol ADMIN')
    }
    return employee
}
