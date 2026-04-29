import { NextRequest } from 'next/server'
import { taskController } from '@/modules/tasks/controllers/task.controller'

export async function PUT(req: NextRequest) {
    return taskController.reassignTask(req)
}
