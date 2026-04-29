import { NextRequest } from 'next/server'
import { attendanceController } from '@/modules/attendance/controllers/attendance.controller'

export async function POST(req: NextRequest) {
    return attendanceController.resume(req)
}
