import { inAppNotificationAdapter } from '../adapters/in-app-notification.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'
import { TaskCompletedEvent } from '../events/task-completed.event'

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
}

export const inAppNotificationListener = new InAppNotificationListener()
