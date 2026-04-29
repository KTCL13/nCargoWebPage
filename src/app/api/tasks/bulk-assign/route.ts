import { NextRequest } from 'next/server'
import { taskController } from '@/modules/tasks/controllers/task.controller'

export async function POST(req: NextRequest) {
    return taskController.bulkAssign(req)
}
