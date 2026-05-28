// src/modules/tasks/controllers/task.controller.ts
import { NextRequest, NextResponse } from 'next/server'
import { taskService } from '../services/task.service'
import { CreateTaskDto } from '../dtos/create-task.dto'
import { UpdateTaskDto } from '../dtos/update-task.dto'
import { ReassignTaskDto } from '../dtos/reassign-task.dto'
import { BulkAssignTaskDto } from '../dtos/bulk-assign-task.dto'
import { FilterTaskDto } from '../dtos/filter-task.dto'
import { TaskStatusName } from '../dtos/task-status.type'
import { getAuthEmployee, requireAdmin } from '@/lib/auth-guard'

function authErrorResponse(error: unknown) {
    const status =
        error instanceof Error && error.message.startsWith('Forbidden')
            ? 403
            : error instanceof Error && error.message.includes('Token')
                ? 401
                : 400
    return NextResponse.json(
        { message: error instanceof Error ? error.message : 'No autorizado' },
        { status },
    )
}

class TaskController {
    async findById(req: NextRequest) {
        let auth
        try {
            auth = getAuthEmployee(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const id = Number(url.searchParams.get('id'))

        try {
            const result = await taskService.findById(id)
            // Employees may only read their own tasks
            if (auth.role !== 'ADMIN' && result?.employeeId !== auth.id) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
            }
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async findAll(req: NextRequest) {
        let auth
        try {
            auth = getAuthEmployee(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        const url = new URL(req.url)
        const page = Number(url.searchParams.get('page') ?? '1')
        const limit = Number(url.searchParams.get('limit') ?? '10')
        const status = url.searchParams.get('status') as TaskStatusName | null
        const requestedEmployeeId = url.searchParams.get('employeeId')

        // Non-admins can only list their own tasks regardless of the query param
        const employeeId = auth.role === 'ADMIN'
            ? (requestedEmployeeId ? Number(requestedEmployeeId) : undefined)
            : auth.id

        const filter: FilterTaskDto = {
            employeeId,
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
            const actor = getAuthEmployee(req)
            const url = new URL(req.url)
            const id = Number(url.searchParams.get('id'))
            const body: UpdateTaskDto = await req.json()

            const result = await taskService.update(id, { ...body, actorId: actor.id })
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status: 400 },
            )
        }
    }

    async remove(req: NextRequest) {
        let admin
        try {
            admin = requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
        try {
            const url = new URL(req.url)
            const id = Number(url.searchParams.get('id'))
            const body = await req.json().catch(() => ({})) as { reason?: string }

            await taskService.delete(id, body.reason, admin.id)
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



    async checkOverdue(req: NextRequest) {
        try {
            requireAdmin(req)
        } catch (error) {
            return authErrorResponse(error)
        }
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
