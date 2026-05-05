import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
    try {
        const employee = getAuthEmployee(req)

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

        await prisma.employee.update({
            where: { id: employee.id },
            data: { timezone },
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
