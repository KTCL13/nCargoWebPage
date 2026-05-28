import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '@/modules/tasks/services/task.service'

// POST /api/cron/warn-due-soon-tasks
//
// Finds PENDING/IN_PROGRESS tasks expiring within the next 70 minutes that
// haven't been warned yet, sends in-app + email notifications to the assigned
// employee and the admin, then marks each task with metadata.dueSoonWarned=true
// so subsequent ticks don't re-notify.
//
// Scheduled every 30 minutes from .github/workflows/warn-due-soon-tasks.yml.
// Auth: x-vercel-cron header OR Authorization: Bearer ${CRON_SECRET}.
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
        const result = await taskService.warnDueSoonTasks()
        return NextResponse.json({ ok: true, ...result })
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : 'Error interno' },
            { status: 500 },
        )
    }
}
