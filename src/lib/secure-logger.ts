import { auditLog } from '@/lib/audit-logger'

// ---------------------------------------------------------------------------
// PII masking
// ---------------------------------------------------------------------------

const EMAIL_KEY   = /email/i
const PHONE_KEY   = /phone|telefon|celular/i
const ID_KEY      = /identification|cedula|passport|dni|nit/i
const NAME_KEY    = /\b(first|last|full)?name\b|nombre|apellido/i

function maskEmail(v: string): string {
    const at = v.indexOf('@')
    if (at <= 0) return '***'
    const local  = v.slice(0, at)
    const domain = v.slice(at)
    const show   = Math.min(3, Math.floor(local.length / 2))
    return local.slice(0, show) + '*'.repeat(Math.max(1, local.length - show)) + domain
}

function maskPhone(v: string): string {
    const d = v.replace(/\D/g, '')
    if (d.length <= 4) return '****'
    return d.slice(0, 2) + '*'.repeat(d.length - 4) + d.slice(-2)
}

function maskIdentifier(v: string): string {
    if (v.length <= 4) return '****'
    return v.slice(0, 2) + '*'.repeat(v.length - 4) + v.slice(-2)
}

function maskName(v: string): string {
    return v.split(/\s+/).map(w => (w.length > 0 ? w[0] + '***' : '')).join(' ')
}

function maskValue(key: string, value: unknown): unknown {
    if (typeof value !== 'string') return value
    if (EMAIL_KEY.test(key))  return maskEmail(value)
    if (PHONE_KEY.test(key))  return maskPhone(value)
    if (ID_KEY.test(key))     return maskIdentifier(value)
    if (NAME_KEY.test(key))   return maskName(value)
    return value
}

/** Recursively masks PII fields in an object before it is written to the audit log. */
export function sanitizePii(obj: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
            if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
                return [k, sanitizePii(v as Record<string, unknown>)]
            }
            return [k, maskValue(k, v)]
        }),
    )
}

// ---------------------------------------------------------------------------
// Secure audit log — always stores userId + action + timestamp + IP;
// PII in oldValues / newValues is automatically masked.
// ---------------------------------------------------------------------------

type SecureAuditParams = {
    entityType: string
    entityId: number
    action: string
    /** Numeric user ID — never an email or name. */
    performedBy?: number | null
    /** IP address extracted from the originating HTTP request. */
    ipAddress?: string
    /** Will be PII-sanitized before storage. */
    oldValues?: Record<string, unknown>
    /** Will be PII-sanitized before storage. */
    newValues?: Record<string, unknown>
}

export async function secureAuditLog(params: SecureAuditParams): Promise<void> {
    await auditLog({
        entityType:  params.entityType,
        entityId:    params.entityId,
        action:      params.action,
        performedBy: params.performedBy,
        ipAddress:   params.ipAddress,
        oldValues:   params.oldValues  ? sanitizePii(params.oldValues)  : undefined,
        newValues:   params.newValues  ? sanitizePii(params.newValues)  : undefined,
    })
}
