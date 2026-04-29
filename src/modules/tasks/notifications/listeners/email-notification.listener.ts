import { emailAdapter } from '../adapters/email.adapter'
import { TaskAssignedEvent } from '../events/task-assigned.event'
import { TaskReassignedEvent } from '../events/task-reassigned.event'
import { TaskNotDoneEvent } from '../events/task-not-done.event'

class EmailNotificationListener {
    async handleTaskAssigned(event: TaskAssignedEvent): Promise<void> {
        await emailAdapter.sendTaskAssigned(event.employeeEmail, event.employeeName, event.taskTitle)
    }

    async handleTaskReassigned(event: TaskReassignedEvent): Promise<void> {
        await emailAdapter.sendTaskReassigned(event.newEmployeeEmail, event.newEmployeeName, event.taskTitle)
    }

    async handleTaskNotDone(event: TaskNotDoneEvent): Promise<void> {
        await emailAdapter.sendTaskNotDoneWarningToAdmin(
            event.adminEmail,
            event.adminName,
            event.taskTitle,
            event.employeeName,
        )
    }
}

export const emailNotificationListener = new EmailNotificationListener()
