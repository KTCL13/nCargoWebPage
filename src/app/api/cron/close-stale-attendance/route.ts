import { NextRequest, NextResponse } from 'next/server'
import { attendanceService } from '@/modules/attendance/services/attendance.service'

// POST /api/cron/close-stale-attendance
//
// Closes every OPEN/PAUSED attendance whose calendar day (in the employee's
// timezone) is already over, stamping CLOCK_OUT at 23:59:59 of that day.
//
// Designed to be invoked by Vercel Cron once per hour — covers all timezones
// while only closing sessions whose local midnight has actually passed.
//
// Auth: either the Vercel Cron signature header `x-vercel-cron` (set
// automatically by the platform), or `Authorization: Bearer ${CRON_SECRET}`
// for self-hosted setups and manual triggers.
export async function POST(req: NextRequest) {
    const isVercelCron = req.headers.get('x-vercel-cron') === '1'
    const auth = req.headers.get('authorization')
    const secret = process.env.CRON_SECRET

    const authorized =
        isVercelCron ||
        (Boolean(secret) && auth === `Bearer ${secret}`)

    if (!authorized) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await attendanceService.closeAllStaleSessions()
        return NextResponse.json({ ok: true, ...result })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno' },
            { status: 500 },
        )
    }
}
