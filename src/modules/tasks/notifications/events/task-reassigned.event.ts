export type TaskReassignedEvent = {
    taskId: number
    taskTitle: string
    previousEmployeeId: number
    newEmployeeId: number
    newEmployeeName: string
    newEmployeeEmail: string
    adminId: number
}
