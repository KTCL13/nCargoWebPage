import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'
import { auditLog } from '@/lib/audit-logger'

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const admin = getAuthEmployee(req)
        if (admin.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
        }

        const { id } = await params
        const employeeId = Number(id)
        if (!employeeId) {
            return NextResponse.json({ message: 'ID inválido' }, { status: 400 })
        }

        const body = await req.json()
        const { timezone } = body

        if (!timezone || typeof timezone !== 'string') {
            return NextResponse.json({ message: 'timezone es requerido' }, { status: 400 })
        }

        try {
            Intl.DateTimeFormat(undefined, { timeZone: timezone })
        } catch {
            return NextResponse.json({ message: 'Timezone inválida' }, { status: 400 })
        }

        const existing = await prisma.employee.findUnique({ where: { id: employeeId } })
        if (!existing) {
            return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 })
        }

        const previousTimezone = existing.timezone

        await prisma.employee.update({
            where: { id: employeeId },
            data: { timezone },
        })

        await auditLog({
            entityType: 'Employee',
            entityId: employeeId,
            action: 'TIMEZONE_CHANGE',
            performedBy: admin.id,
            oldValues: { timezone: previousTimezone },
            newValues: { employeeId, from: previousTimezone, to: timezone, changedBy: admin.id },
        })

        return NextResponse.json({ message: 'Timezone actualizada' })
    } catch (error: unknown) {
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}
