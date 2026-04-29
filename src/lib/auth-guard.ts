import { NextRequest } from 'next/server'
import { jwtService } from '@/modules/auth/services/jwt.service'

type AuthEmployee = { id: number; email: string; role: string }

export function getAuthEmployee(req: NextRequest): AuthEmployee {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
        throw new Error('Token no proporcionado')
    }

    const token = authHeader.slice(7)
    return jwtService.verify(token)
}
