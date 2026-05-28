import { emailAdapter } from '../adapters/email.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'
import { TaskCancelledEvent } from '../events/task-cancelled.event'
import { TaskDueSoonEvent } from '../events/task-due-soon.event'

class EmailNotificationListener {
    async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
        try {
            await emailAdapter.sendTaskAssigned(event.employeeEmail, event.employeeName, event.taskTitle)
        } catch (error) {
            console.error('[email] task.assigned send failed', { taskId: event.taskId, to: event.employeeEmail, error })
        }
    }

    async handleTaskReassigned(event: TaskReassignedEvent): Promise<void> {
        try {
            await emailAdapter.sendTaskReassigned(event.newEmployeeEmail, event.newEmployeeName, event.taskTitle)
        } catch (error) {
            console.error('[email] task.reassigned send failed', { taskId: event.taskId, to: event.newEmployeeEmail, error })
        }
    }

    async handleTaskNotDone(event: TaskNotDoneEvent): Promise<void> {
        await Promise.allSettled([
            emailAdapter.sendTaskNotDoneWarningToAdmin(event.adminEmail, event.adminName, event.taskTitle, event.employeeName)
                .catch(error => console.error('[email] task.not_done admin send failed', { taskId: event.taskId, to: event.adminEmail, error })),
            emailAdapter.sendTaskNotDoneToEmployee(event.employeeEmail, event.employeeName, event.taskTitle)
                .catch(error => console.error('[email] task.not_done employee send failed', { taskId: event.taskId, to: event.employeeEmail, error })),
        ])
    }

    async handleTaskDueSoon(event: TaskDueSoonEvent): Promise<void> {
        await Promise.allSettled([
            emailAdapter.sendTaskDueSoonToEmployee(event.employeeEmail, event.employeeName, event.taskTitle, event.endTime)
                .catch(error => console.error('[email] task.due_soon employee send failed', { taskId: event.taskId, to: event.employeeEmail, error })),
            emailAdapter.sendTaskDueSoonToAdmin(event.adminEmail, event.adminName, event.taskTitle, event.employeeName, event.endTime)
                .catch(error => console.error('[email] task.due_soon admin send failed', { taskId: event.taskId, to: event.adminEmail, error })),
        ])
    }

    async handleTaskCancelled(event: TaskCancelledEvent): Promise<void> {
        try {
            await emailAdapter.sendTaskCancelled(event.employeeEmail, event.employeeName, event.taskTitle, event.reason)
        } catch (error) {
            console.error('[email] task.cancelled send failed', { taskId: event.taskId, to: event.employeeEmail, error })
        }
    }
}

export const emailNotificationListener = new EmailNotificationListener()
