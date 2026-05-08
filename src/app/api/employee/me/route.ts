import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const auth = getAuthEmployee(req)

        const employee = await prisma.employee.findUnique({
            where: { id: auth.id },
            include: {
                identificationType: true,
                contracts: {
                    where: { isActive: true },
                    include: { job: true },
                    take: 1
                }
            }
        })

        if (!employee) {
            return NextResponse.json({ message: 'Empleado no encontrado' }, { status: 404 })
        }

        // Remove sensitive info
        const { passwordHash, ...safeEmployee } = employee
        return NextResponse.json(safeEmployee)
    } catch (error: unknown) {
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const auth = getAuthEmployee(req)

        const body = await req.json()
        const { timezone, firstName, lastName } = body

        const data: any = {}
        if (timezone) {
            try {
                Intl.DateTimeFormat(undefined, { timeZone: timezone })
                data.timezone = timezone
            } catch {
                return NextResponse.json({ message: 'Timezone inválida' }, { status: 400 })
            }
        }

        if (firstName) data.firstName = firstName
        if (lastName) data.lastName = lastName

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ message: 'Nada que actualizar' }, { status: 400 })
        }

        await prisma.employee.update({
            where: { id: auth.id },
            data,
        })

        return NextResponse.json({ message: 'Perfil actualizado' })
    } catch (error: unknown) {
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno del servidor' },
            { status },
        )
    }
}
