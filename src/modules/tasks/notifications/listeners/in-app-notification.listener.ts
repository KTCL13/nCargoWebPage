import { inAppNotificationAdapter } from '../adapters/in-app-notification.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'

class InAppNotificationListener {
    async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
        await inAppNotificationAdapter.notifyEmployee(
            event.employeeId,
            'TASK_ASSIGNED',
            `Se te ha asignado una nueva tarea: ${event.taskTitle}`,
            { taskId: event.taskId },
        )
    }

    async handleTaskReassigned(event: TaskReassignedEvent): Promise<void> {
        await inAppNotificationAdapter.notifyEmployee(
            event.newEmployeeId,
            'TASK_REASSIGNED',
            `Se te ha reasignado la tarea: ${event.taskTitle}`,
            { taskId: event.taskId },
        )
    }

    async handleTaskNotDone(event: TaskNotDoneEvent): Promise<void> {
        await inAppNotificationAdapter.notifyEmployee(
            event.employeeId,
            'TASK_NOT_DONE',
            `Tu tarea "${event.taskTitle}" no fue iniciada y su plazo venció. Ha sido marcada como NO REALIZADA.`,
            { taskId: event.taskId },
        )
    }
}

export const inAppNotificationListener = new InAppNotificationListener()
