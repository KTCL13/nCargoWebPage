import { NextRequest, NextResponse } from 'next/server'
import { attendanceService } from '@/modules/attendance/services/attendance.service'

/**
 * GET /api/attendance
 * Admin side: List all registries with filters
 */
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url)
        const date = url.searchParams.get('date') || undefined
        const employeeId = url.searchParams.get('employeeId') ? Number(url.searchParams.get('employeeId')) : undefined
        const status = url.searchParams.get('status') as any || undefined
        const page = Number(url.searchParams.get('page') ?? '1')
        const limit = Number(url.searchParams.get('limit') ?? '10')

        const result = await attendanceService.getAllFiltered({
            date,
            employeeId,
            status,
            page,
            limit
        })
        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 400 })
    }
}
