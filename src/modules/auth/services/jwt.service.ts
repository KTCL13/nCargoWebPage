import jwt from 'jsonwebtoken'

type JwtPayload = { id: number; email: string; role: string }

const KNOWN_WEAK_SECRETS = new Set([
    'ncargo_secret_key_change_in_production',
    'secret',
    'changeme',
    'change_me',
])

function loadSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET no definido')
    if (secret.length < 32) {
        throw new Error(
            `JWT_SECRET demasiado corto (${secret.length} chars, se requieren ≥32). ` +
            `Configura la variable de entorno en el panel de tu proveedor de deploy.`,
        )
    }
    if (KNOWN_WEAK_SECRETS.has(secret)) {
        throw new Error('JWT_SECRET coincide con un valor por defecto inseguro — rótalo')
    }
    return secret
}

class JwtService {
    sign(payload: JwtPayload): string {
        return jwt.sign(payload, loadSecret(), { expiresIn: '1d' })
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
