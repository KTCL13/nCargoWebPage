import { NextRequest } from 'next/server'
import { taskController } from '@/modules/tasks/controllers/task.controller'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)

    if (searchParams.get('id')) {
        return taskController.findById(req)
    }

    return taskController.findAll(req)
}

export async function POST(req: NextRequest) {
    return taskController.assignTask(req)
}

export async function PUT(req: NextRequest) {
    return taskController.update(req)
}

export async function DELETE(req: NextRequest) {
    return taskController.remove(req)
}
