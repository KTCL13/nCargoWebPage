import { NextRequest, NextResponse } from 'next/server'
import { getAuthEmployee } from '@/lib/auth-guard'

export async function PATCH(req: NextRequest) {
    try {
        const employee = await getAuthEmployee(req)
        if (employee.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
        }
        return NextResponse.json(
            { error: 'Deprecated. Use /pause, /resume, or /clock-out instead.' },
            { status: 410 },
        )
    } catch (error: unknown) {
        const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno' },
            { status },
        )
    }
}
