// src/modules/tasks/controllers/task.controller.ts
import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../services/task.service'
import { CreateTaskDto } from '../dtos/create-task.dto'
import { UpdateTaskDto } from '../dtos/update-task.dto'
import { ReassignTaskDto } from '../dtos/reassign-task.dto'
import { BulkAssignTaskDto } from '../dtos/bulk-assign-task.dto'
import { FilterTaskDto } from '../dtos/filter-task.dto'
import { TaskStatusName } from '../dtos/task-status.type'
import { getAuthEmployee } from '@/lib/auth-guard'

class TaskController {
    async findById(req: NextRequest) {
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            const result = await taskService.findById(id)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async findAll(req: NextRequest) {
        const url = new URL(req.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const limit = Number(url.searchParams.get('limit') ?? '10')
        const status = url.searchParams.get('status') as TaskStatusName | null
        const employeeId = url.searchParams.get('employeeId')

        const filter: FilterTaskDto = {
            employeeId: employeeId ? Number(employeeId) : undefined,
            status: status ?? undefined,
            page,
            limit,
        }

        try {
            const result = await taskService.findAll(filter)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async assignTask(req: NextRequest) {
        try {
            const admin = getAuthEmployee(req)
            const body: CreateTaskDto = await req.json()

            const result = await taskService.assignTask(body, admin.id)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async reassignTask(req: NextRequest) {
        try {
            const admin = getAuthEmployee(req)
            const url = new URL(req.url)
            const id = Number(url.searchParams.get('id'))
            const body: ReassignTaskDto = await req.json()

            const result = await taskService.reassignTask(id, body, admin.id)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async update(req: NextRequest) {
        try {
            const url = new URL(req.url)
            const id = Number(url.searchParams.get('id'))
            const body: UpdateTaskDto = await req.json()

            const result = await taskService.update(id, body)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async remove(req: NextRequest) {
        try {
            const url = new URL(req.url)
            const id = Number(url.searchParams.get('id'))

            await taskService.delete(id)
            return new NextResponse(null, { status: 204 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async bulkAssign(req: NextRequest) {
        try {
            const admin = getAuthEmployee(req)
            const body: BulkAssignTaskDto = await req.json()

            const result = await taskService.bulkAssign(body, admin.id)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }



    async checkOverdue(_req: NextRequest) {
        try {
            await taskService.markOverdueTasksAsNotDone()
            return NextResponse.json({ message: 'Overdue tasks processed' }, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }
}

export const taskController = new TaskController()
