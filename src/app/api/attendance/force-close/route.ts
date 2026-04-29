import { NextRequest, NextResponse } from 'next/server'
import { attendanceService } from '@/modules/attendance/services/attendance.service'

/**
 * POST /api/attendance/force-close?id=X
 * Admin action to close an open journey.
 */
export async function POST(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))
        
        if (!id) return NextResponse.json({ message: 'ID es requerido' }, { status: 400 })

        // Mock adminId as 1 for now (should come from auth session in a real app)
        const result = await attendanceService.forceClose(id, 1)
        
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 })
    }
}
