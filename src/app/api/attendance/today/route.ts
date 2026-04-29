import { NextRequest } from 'next/server'
import { attendanceController } from '@/modules/attendance/controllers/attendance.controller'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
    return attendanceController.getToday(req)
}
