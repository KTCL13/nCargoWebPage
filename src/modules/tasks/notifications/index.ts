import { eventBus } from './event-bus'
import { emailNotificationListener } from './listeners/email-notification.listener'
import { inAppNotificationListener } from './listeners/in-app-notification.listener'
import { TaskAssignedEvent } from './events/task-assigned.event'
import { TaskReassignedEvent } from './events/task-reassigned.event'
import { TaskNotDoneEvent } from './events/task-not-done.event'
import { TaskCompletedEvent } from './events/task-completed.event'

eventBus.subscribe('task.assigned',   (e) => emailNotificationListener.handleTaskAssigned(e as TaskAssignedEvent))
eventBus.subscribe('task.assigned',   (e) => inAppNotificationListener.handleTaskAssigned(e as TaskAssignedEvent))
eventBus.subscribe('task.reassigned', (e) => emailNotificationListener.handleTaskReassigned(e as TaskReassignedEvent))
eventBus.subscribe('task.reassigned', (e) => inAppNotificationListener.handleTaskReassigned(e as TaskReassignedEvent))
eventBus.subscribe('task.not_done',   (e) => emailNotificationListener.handleTaskNotDone(e as TaskNotDoneEvent))
eventBus.subscribe('task.not_done',   (e) => inAppNotificationListener.handleTaskNotDone(e as TaskNotDoneEvent))
eventBus.subscribe('task.completed',  (e) => inAppNotificationListener.handleTaskCompleted(e as TaskCompletedEvent))
