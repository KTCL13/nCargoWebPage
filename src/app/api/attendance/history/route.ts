import { NextRequest } from 'next/server'
import { attendanceController } from '@/modules/attendance/controllers/attendance.controller'

export async function GET(req: NextRequest) {
    return attendanceController.getHistory(req)
}
