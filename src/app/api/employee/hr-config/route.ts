import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        getAuthEmployee(req)
        const keys = ['overtime_multiplier', 'overtime_threshold_hours', 'smlv', 'min_hourly_rate']
        const configs = await prisma.systemConfig.findMany({ where: { key: { in: keys } } })
        const result: Record<string, number> = {}
        for (const c of configs) result[c.key] = Number(c.value)
        return NextResponse.json(result)
    } catch (error: unknown) {
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}
