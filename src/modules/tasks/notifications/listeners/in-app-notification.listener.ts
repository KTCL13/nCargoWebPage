import { inAppNotificationAdapter } from '../adapters/in-app-notification.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'
import { TaskCompletedEvent } from '../events/task-completed.event'
import { TaskCancelledEvent } from '../events/task-cancelled.event'
import { TaskDueSoonEvent } from '../events/task-due-soon.event'

class InAppNotificationListener {
    async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
        await Promise.all([
            inAppNotificationAdapter.notifyEmployee(
                event.employeeId,
                'TASK_ASSIGNED',
                `Se te ha asignado una nueva tarea: ${event.taskTitle}`,
                { taskId: event.taskId },
            ),
            inAppNotificationAdapter.notifyEmployee(
                event.adminId,
                'TASK_ASSIGNED',
                `Se ha asignado la tarea "${event.taskTitle}" a ${event.employeeName}`,
                { taskId: event.taskId },
            ),
        ])
    }

    async handleTaskReassigned(event: TaskReassignedEvent): Promise<void> {
        await Promise.all([
            inAppNotificationAdapter.notifyEmployee(
                event.newEmployeeId,
                'TASK_REASSIGNED',
                `Se te ha reasignado la tarea: ${event.taskTitle}`,
                { taskId: event.taskId },
            ),
            inAppNotificationAdapter.notifyEmployee(
                event.adminId,
                'TASK_REASSIGNED',
                `Se ha reasignado la tarea "${event.taskTitle}" a ${event.newEmployeeName}`,
                { taskId: event.taskId },
            ),
        ])
    }

    async handleTaskNotDone(event: TaskNotDoneEvent): Promise<void> {
        await Promise.all([
            inAppNotificationAdapter.notifyEmployee(
                event.employeeId,
                'TASK_NOT_DONE',
                `Tu tarea "${event.taskTitle}" no fue iniciada y su plazo venció. Ha sido marcada como NO REALIZADA.`,
                { taskId: event.taskId },
            ),
            inAppNotificationAdapter.notifyEmployee(
                event.adminId,
                'TASK_NOT_DONE',
                `${event.employeeName} no realizó la tarea "${event.taskTitle}" dentro del plazo.`,
                { taskId: event.taskId },
            ),
        ])
    }

    async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
        await inAppNotificationAdapter.notifyEmployee(
            event.adminId,
            'TASK_COMPLETED',
            `${event.employeeName} completó la tarea "${event.taskTitle}".`,
            { taskId: event.taskId },
        )
    }

    async handleTaskCancelled(event: TaskCancelledEvent): Promise<void> {
        await inAppNotificationAdapter.notifyEmployee(
            event.employeeId,
            'TASK_CANCELLED',
            `Tu tarea "${event.taskTitle}" ha sido cancelada. Motivo: ${event.reason}`,
            { taskId: event.taskId },
        )
    }

    async handleTaskDueSoon(event: TaskDueSoonEvent): Promise<void> {
        const formatted = new Date(event.endTime).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        await Promise.all([
            inAppNotificationAdapter.notifyEmployee(
                event.employeeId,
                'TASK_DUE_SOON',
                `⏰ Tu tarea "${event.taskTitle}" vence a las ${formatted}. ¡Complétala a tiempo!`,
                { taskId: event.taskId },
            ),
            inAppNotificationAdapter.notifyEmployee(
                event.adminId,
                'TASK_DUE_SOON',
                `⏰ La tarea "${event.taskTitle}" de ${event.employeeName} vence a las ${formatted}.`,
                { taskId: event.taskId },
            ),
        ])
    }
}

export const inAppNotificationListener = new InAppNotificationListener()
