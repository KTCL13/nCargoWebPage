import { emailAdapter } from '../adapters/email.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'

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
        try {
            await emailAdapter.sendTaskNotDoneWarningToAdmin(
                event.adminEmail,
                event.adminName,
                event.taskTitle,
                event.employeeName,
            )
        } catch (error) {
            console.error('[email] task.not_done send failed', { taskId: event.taskId, to: event.adminEmail, error })
        }
    }
}

export const emailNotificationListener = new EmailNotificationListener()
