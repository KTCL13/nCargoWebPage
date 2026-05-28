import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'

export type JwtPayload = { id: number; email: string; role: string; jti: string }

const KNOWN_WEAK_SECRETS = new Set([
    'ncargo_secret_key_change_in_production',
    'secret',
    'changeme',
    'change_me',
])

function loadSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET no definido')
    if (KNOWN_WEAK_SECRETS.has(secret)) {
        throw new Error(
            'JWT_SECRET es un valor conocido como inseguro. Genera uno nuevo con: openssl rand -base64 48',
        )
    }
    if (secret.length < 32) {
        throw new Error(
            `JWT_SECRET demasiado corto (${secret.length} chars, se requieren ≥32). Genera uno con: openssl rand -base64 48`,
        )
    }
    return secret
}

class JwtService {
    sign(payload: Omit<JwtPayload, 'jti'>): { token: string; jti: string } {
        const jti = randomUUID()
        const token = jwt.sign({ ...payload, jti }, loadSecret(), { expiresIn: '4h' })
        return { token, jti }
    }

    verify(token: string): JwtPayload {
        try {
            return jwt.verify(token, loadSecret()) as JwtPayload
        } catch {
            throw new Error('Token inválido o expirado')
        }
    }
}

export const jwtService = new JwtService()
