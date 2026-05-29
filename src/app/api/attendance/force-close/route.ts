import { NextRequest, NextResponse } from 'next/server'
import { attendanceService } from '@/modules/attendance/services/attendance.service'
import { getAuthEmployee } from '@/lib/auth-guard'

/**
 * POST /api/attendance/force-close?id=X
 * Admin action to close an open journey.
 */
export async function POST(req: NextRequest) {
    try {
        const employee = await getAuthEmployee(req)
        if (employee.role !== 'ADMIN') {
            return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
        }

        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        if (!id) return NextResponse.json({ message: 'ID es requerido' }, { status: 400 })

        const result = await attendanceService.forceClose(id, employee.id)

        return NextResponse.json(result)
    } catch (error: any) {
        const status = error.message.includes('Token') ? 401 : 400
        return NextResponse.json({ message: error.message }, { status })
    }
}
