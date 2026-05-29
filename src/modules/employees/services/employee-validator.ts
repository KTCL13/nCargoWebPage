import { prisma } from '@/lib/prisma'

// ReDoS-safe: no nested quantifiers; max length check prevents slow paths on crafted inputs
const EMAIL_RE = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~\-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~\-]+)*)@(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export function assertValidEmail(email: string): void {
    const trimmed = email.trim()
    if (!trimmed) throw new Error('El correo electrónico es obligatorio')
    if (trimmed.length > 254) throw new Error('El correo electrónico no puede superar 254 caracteres')
    if (!EMAIL_RE.test(trimmed)) throw new Error(`"${trimmed}" no es un correo electrónico válido`)
}

export function assertValidPassword(password: string | undefined): void {
    if (!password || password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password))
        throw new Error('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número')
}

// Validates salary/hourlyRate against SystemConfig thresholds based on contract type.
// Monthly contracts check salary against SMLV; hourly contracts check hourlyRate against min_hourly_rate.
export async function validateContractRates(contractTypeId: number, salary: number, hourlyRate: number): Promise<void> {
    const [smlvCfg, minHourlyCfg, contractType] = await Promise.all([
        prisma.systemConfig.findUnique({ where: { key: 'smlv' } }),
        prisma.systemConfig.findUnique({ where: { key: 'min_hourly_rate' } }),
        prisma.contractType.findUnique({ where: { id: contractTypeId } }),
    ])

    const isHourly = contractType?.name?.toUpperCase().includes('HORA') ?? false

    const MAX_SALARY = 9_999_999_999.99
    const MAX_HOURLY = 99_999_999.99

    if (!isHourly) {
        if (salary > MAX_SALARY)
            throw new Error(`El salario no puede superar $${MAX_SALARY.toLocaleString('es-CO')}`)
        if (smlvCfg) {
            const smlv = Number(smlvCfg.value)
            if (salary < smlv)
                throw new Error(`El salario no puede ser menor al SMLV ($${smlv.toLocaleString('es-CO')})`)
        }
    }
    if (isHourly) {
        if (hourlyRate > MAX_HOURLY)
            throw new Error(`La tarifa por hora no puede superar $${MAX_HOURLY.toLocaleString('es-CO')}/h`)
        if (minHourlyCfg) {
            const minRate = Number(minHourlyCfg.value)
            if (hourlyRate < minRate)
                throw new Error(`La tarifa por hora no puede ser menor al mínimo legal ($${minRate.toLocaleString('es-CO')}/h)`)
        }
    }
}
