import jwt from 'jsonwebtoken'

type JwtPayload = { id: number; email: string; role: string }

class JwtService {
    sign(payload: JwtPayload): string {
        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('JWT_SECRET no definido')
        return jwt.sign(payload, secret, { expiresIn: '1d' })
    }

    verify(token: string): JwtPayload {
        const secret = process.env.JWT_SECRET
        if (!secret) throw new Error('JWT_SECRET no definido')
        try {
            return jwt.verify(token, secret) as JwtPayload
        } catch {
            throw new Error('Token inválido o expirado')
        }
    }
}

export const jwtService = new JwtService()
