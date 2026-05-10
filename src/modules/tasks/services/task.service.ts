import '../notifications'
import { fullName } from '@/modules/employees/services/employee.service'
import { taskRepository } from '../repositories/task.repository'
import { taskStatusRepository } from '../repositories/taskStatus.repository'
import { employeeRepository } from '@/modules/employees/repositories/employee.repository'
import { attendanceRepository } from '@/modules/attendance/repositories/attendance.repository'
import { CreateTaskDto } from '../dtos/create-task.dto'
import { UpdateTaskDto } from '../dtos/update-task.dto'
import { ReassignTaskDto } from '../dtos/reassign-task.dto'
import { BulkAssignTaskDto } from '../dtos/bulk-assign-task.dto'
import { FilterTaskDto } from '../dtos/filter-task.dto'
import { TaskResponseDto } from '../dtos/task-response.dto'
import { PaginatedResponseDto } from '../dtos/paginated-response.dto'
import { TaskStatusName } from '../dtos/task-status.type'
import { Task, Prisma } from '@prisma/client'
import { eventBus } from '../notifications/event-bus'
import { auditLog } from '@/lib/audit-logger'

class TaskService {
    private async resolveStatusId(name: TaskStatusName): Promise<number> {
        const status = await taskStatusRepository.findByName(name)

        if (!status) {
            throw new Error(`TaskStatus '${name}' no existe en la tabla task_status`)
        }

        return status.id
    }

    private async toTaskResponseDto(task: Task): Promise<TaskResponseDto> {
        const status = await taskStatusRepository.findById(task.statusId)

        if (!status) {
            throw new Error(`TaskStatus con id ${task.statusId} no encontrado`)
        }

        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: status.name as TaskStatusName,
            employeeId: task.employeeId,
            createdBy: task.createdBy,
            assignedBy: task.assignedBy ?? null,
            startTime: task.startTime,
            endTime: task.endTime,
            minutesSpent: task.minutesSpent,
            metadata: task.metadata as Record<string, unknown> | null,
            createdAt: task.createdAt,
        }
    }

    async findById(id: number): Promise<TaskResponseDto> {
        const task = await taskRepository.findById(id)
        if (!task) throw new Error(`Task not found with id ${id}`)
        return this.toTaskResponseDto(task)
    }

    async findAll(filter: FilterTaskDto): Promise<PaginatedResponseDto> {
        const tasks = await taskRepository.findAll(filter)
        const total = await taskRepository.count(filter)
        const data = await Promise.all(tasks.map(task => this.toTaskResponseDto(task)))

        return {
            data,
            total,
            page: filter.page || 1,
            limit: filter.limit || 10,
        }
    }

    async assignTask(dto: CreateTaskDto, adminId: number): Promise<TaskResponseDto> {
        if (!adminId) {
            throw new Error('adminId es requerido')
        }

        // ✅ VALIDACIÓN DE FECHAS
        if (dto.startTime && dto.endTime) {
            if (new Date(dto.endTime) < new Date(dto.startTime)) {
                throw new Error('La fecha de fin no puede ser menor que la de inicio')
            }
        }

        const pendingStatusId = await this.resolveStatusId('PENDING')

        const task = await taskRepository.create({
            title: dto.title,
            description: dto.description,
            employeeId: dto.employeeId,
            createdBy: adminId,
            assignedBy: adminId,
            statusId: pendingStatusId,

            // ✅ CONVERSIÓN CORRECTA
            startTime: dto.startTime ? new Date(dto.startTime) : undefined,
            endTime: dto.endTime ? new Date(dto.endTime) : undefined,

            metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        })

        const employee = await employeeRepository.getEmployeeById(dto.employeeId)

        if (employee) {
            await eventBus.publish('task.assigned', {
                taskId: task.id,
                taskTitle: task.title,
                employeeId: employee.id,
                employeeName: fullName(employee),
                employeeEmail: employee.email,
                adminId,
            })
        }

        return this.toTaskResponseDto(task)
    }

    async reassignTask(taskId: number, dto: ReassignTaskDto, adminId: number): Promise<TaskResponseDto> {
        const existing = await taskRepository.findById(taskId)

        if (!existing) {
            throw new Error(`Task no encontrada con id ${taskId}`)
        }

        const task = await taskRepository.update(taskId, {
            employee: { connect: { id: dto.newEmployeeId } },
        })

        const newEmployee = await employeeRepository.getEmployeeById(dto.newEmployeeId)
        if (newEmployee) {
            await eventBus.publish('task.reassigned', {
                taskId: task.id,
                taskTitle: task.title,
                previousEmployeeId: existing.employeeId,
                newEmployeeId: newEmployee.id,
                newEmployeeName: fullName(newEmployee),
                newEmployeeEmail: newEmployee.email,
                adminId,
            })
        }

        return this.toTaskResponseDto(task)
    }

    async update(id: number, dto: UpdateTaskDto): Promise<TaskResponseDto> {
        const existing = await taskRepository.findById(id)

        if (!existing) {
            throw new Error(`Task no encontrada con id ${id}`)
        }

        const data: Parameters<typeof taskRepository.update>[1] = {}

        if (dto.title !== undefined) data.title = dto.title
        if (dto.description !== undefined) data.description = dto.description
        if (dto.minutesSpent !== undefined) data.minutesSpent = dto.minutesSpent
        if (dto.endTime !== undefined) data.endTime = dto.endTime

        if (dto.status) {
            const statusId = await this.resolveStatusId(dto.status)
            data.status = { connect: { id: statusId } }

            const isSelfUpdate = dto.actorId === existing.employeeId
            const emp = await employeeRepository.getEmployeeById(existing.employeeId)
            const timezone = emp?.timezone ?? 'America/Bogota'
            const activeAttendance = await attendanceRepository.findActiveByEmployee(existing.employeeId, timezone)

            // Employees can only change their own task status while their attendance session is open or paused
            if (isSelfUpdate && !activeAttendance) {
                throw new Error('Debes iniciar tu jornada laboral antes de actualizar el estado de una tarea')
            }

            if (dto.status === 'COMPLETED' && !dto.endTime) {
                data.endTime = new Date()
            }

            if (dto.status === 'IN_PROGRESS' && !existing.attendanceId && activeAttendance) {
                data.attendance = { connect: { id: activeAttendance.id } }
            }
        }

        const task = await taskRepository.update(id, data)

        if (dto.status) {
            await auditLog({
                entityType: 'Task',
                entityId: id,
                action: dto.status,
                performedBy: existing.employeeId,
                oldValues: { status: (await taskStatusRepository.findById(existing.statusId))?.name },
                newValues: { status: dto.status },
            })

            if (dto.status === 'COMPLETED' && dto.actorId) {
                const employee = await employeeRepository.getEmployeeById(existing.employeeId)
                if (employee) {
                    await eventBus.publish('task.completed', {
                        taskId: id,
                        taskTitle: existing.title,
                        employeeId: existing.employeeId,
                        employeeName: fullName(employee),
                        adminId: existing.createdBy,
                    })
                }
            }
        }

        return this.toTaskResponseDto(task)
    }

    async delete(id: number): Promise<void> {
        const existing = await taskRepository.findById(id)

        if (!existing) {
            throw new Error(`Task no encontrada con id ${id}`)
        }

        await taskRepository.delete(id)
    }

    async bulkAssign(dto: BulkAssignTaskDto, adminId: number): Promise<TaskResponseDto[]> {
        const pendingStatusId = await this.resolveStatusId('PENDING')

        const tasks = await Promise.all(
            dto.employeeIds.map(employeeId =>
                taskRepository.create({
                    title: dto.title,
                    description: dto.description,
                    employeeId,
                    createdBy: adminId,
                    assignedBy: adminId,
                    statusId: pendingStatusId,
                    startTime: dto.startTime,
                    endTime: dto.endTime,
                    metadata: dto.metadata as Prisma.InputJsonValue | undefined,
                }),
            ),
        )

        await Promise.all(
            tasks.map(async task => {
                const employee = await employeeRepository.getEmployeeById(task.employeeId)
                if (employee) {
                    await eventBus.publish('task.assigned', {
                        taskId: task.id,
                        taskTitle: task.title,
                        employeeId: employee.id,
                        employeeName: fullName(employee),
                        employeeEmail: employee.email,
                        adminId,
                    })
                }
            }),
        )

        return Promise.all(tasks.map(task => this.toTaskResponseDto(task)))
    }



    async markOverdueTasksAsNotDone(): Promise<void> {
        const overdueTasks = await taskRepository.findOverduePending()

        if (overdueTasks.length === 0) return

        const notDoneStatusId = await this.resolveStatusId('NOT_DONE')

        await Promise.all(
            overdueTasks.map(async task => {
                await taskRepository.update(task.id, {
                    status: { connect: { id: notDoneStatusId } },
                })

                const [employee, admin] = await Promise.all([
                    employeeRepository.getEmployeeById(task.employeeId),
                    task.assignedBy ? employeeRepository.getEmployeeById(task.assignedBy) : null,
                ])

                if (employee && admin) {
                    await eventBus.publish('task.not_done', {
                        taskId: task.id,
                        taskTitle: task.title,
                        employeeId: employee.id,
                        employeeName: fullName(employee),
                        employeeEmail: employee.email,
                        adminId: admin.id,
                        adminEmail: admin.email,
                        adminName: fullName(admin),
                    })
                }
            }),
        )
    }
}

export const taskService = new TaskService()
