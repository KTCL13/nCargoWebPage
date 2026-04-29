import { prisma } from '@/lib/prisma'

interface PerformanceParams {
    employeeId?: number
    from?: Date
    to?: Date
}

interface CompletionParams {
    employeeId?: number
    from?: Date
    to?: Date
}

interface WorkloadParams {
    from?: Date
    to?: Date
}

class AnalyticsService {
    async getEmployeePerformance(params: PerformanceParams) {
        const { employeeId, from, to } = params

        const dateFilter = {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
        }

        const taskWhere = {
            ...(employeeId && { employeeId }),
            ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
        }

        const employees = employeeId
            ? await prisma.employee.findMany({ where: { id: employeeId } })
            : await prisma.employee.findMany({ where: { status: 'ACTIVE' } })

        const results = await Promise.all(
            employees.map(async employee => {
                const [completedTasks, notDoneTasks, attendances] = await Promise.all([
                    prisma.task.findMany({
                        where: {
                            ...taskWhere,
                            employeeId: employee.id,
                            status: { name: 'COMPLETED' },
                        },
                        include: { status: true },
                    }),
                    prisma.task.count({
                        where: {
                            ...taskWhere,
                            employeeId: employee.id,
                            status: { name: 'NOT_DONE' },
                        },
                    }),
                    prisma.attendance.findMany({
                        where: {
                            employeeId: employee.id,
                            status: 'CLOSED',
                            ...(Object.keys(dateFilter).length && { startedAt: dateFilter }),
                        },
                    }),
                ])

                const tasksCompleted = completedTasks.length
                const notDoneCount = notDoneTasks

                const minutesValues = completedTasks
                    .map(t => {
                        if (t.minutesSpent != null) return t.minutesSpent
                        if (t.startTime && t.endTime) {
                            return Math.round((t.endTime.getTime() - t.startTime.getTime()) / 60000)
                        }
                        return null
                    })
                    .filter((v): v is number => v !== null)

                const avgCompletionMinutes =
                    minutesValues.length > 0
                        ? Math.round(minutesValues.reduce((a, b) => a + b, 0) / minutesValues.length)
                        : null

                const totalWorkedHours = attendances.reduce(
                    (sum, a) => sum + (a.workedHours ? Number(a.workedHours) : 0),
                    0,
                )

                return {
                    employeeId: employee.id,
                    employeeName: employee.name,
                    tasksCompleted,
                    avgCompletionMinutes,
                    totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
                    notDoneCount,
                }
            }),
        )

        return results
    }

    async getTaskCompletionTimes(params: CompletionParams) {
        const { employeeId, from, to } = params

        const dateFilter = {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
        }

        const tasks = await prisma.task.findMany({
            where: {
                ...(employeeId && { employeeId }),
                status: { name: 'COMPLETED' },
                endTime: { not: null },
                startTime: { not: null },
                ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
            },
            include: { status: true, employee: { select: { name: true } } },
        })

        return tasks.map(t => {
            const computedMinutes =
                t.minutesSpent ??
                (t.startTime && t.endTime
                    ? Math.round((t.endTime.getTime() - t.startTime.getTime()) / 60000)
                    : null)

            return {
                taskId: t.id,
                title: t.title,
                employeeId: t.employeeId,
                employeeName: t.employee.name,
                startTime: t.startTime,
                endTime: t.endTime,
                minutesSpent: computedMinutes,
            }
        })
    }

    async getWorkloadDistribution(params: WorkloadParams) {
        const { from, to } = params

        const dateFilter = {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
        }

        const employees = await prisma.employee.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true, name: true },
        })

        const results = await Promise.all(
            employees.map(async employee => {
                const taskWhere = {
                    employeeId: employee.id,
                    ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
                }

                const [totalTasks, statusCounts] = await Promise.all([
                    prisma.task.count({ where: taskWhere }),
                    prisma.task.groupBy({
                        by: ['statusId'],
                        where: taskWhere,
                        _count: { id: true },
                    }),
                ])

                const statuses = await prisma.taskStatus.findMany()
                const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.name]))

                const counts: Record<string, number> = {
                    PENDING: 0,
                    IN_PROGRESS: 0,
                    COMPLETED: 0,
                    NOT_DONE: 0,
                }

                for (const row of statusCounts) {
                    const name = statusMap[row.statusId]
                    if (name in counts) counts[name] = row._count.id
                }

                return {
                    employeeId: employee.id,
                    employeeName: employee.name,
                    totalTasks,
                    pendingCount: counts['PENDING'],
                    inProgressCount: counts['IN_PROGRESS'],
                    completedCount: counts['COMPLETED'],
                    notDoneCount: counts['NOT_DONE'],
                }
            }),
        )

        return results
    }

    async getAlerts() {
        const now = new Date()
        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        const sevenDaysAgo = new Date(now)
        sevenDaysAgo.setDate(now.getDate() - 7)

        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(now.getDate() - 30)

        const [unclosedAttendances, overdueTasks, allEmployees, recentAttendances] =
            await Promise.all([
                prisma.attendance.findMany({
                    where: {
                        status: { in: ['OPEN', 'PAUSED'] },
                        startedAt: { lt: startOfToday },
                    },
                    include: { employee: { select: { id: true, name: true } } },
                }),
                prisma.task.findMany({
                    where: { status: { name: 'NOT_DONE' } },
                    include: { employee: { select: { id: true, name: true } } },
                }),
                prisma.employee.findMany({
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true },
                }),
                prisma.attendance.findMany({
                    where: { startedAt: { gte: sevenDaysAgo } },
                    select: { employeeId: true },
                }),
            ])

        const alerts: Array<{
            type: string
            severity: 'low' | 'medium' | 'high'
            employeeId: number
            employeeName: string
            detail: string
        }> = []

        for (const a of unclosedAttendances) {
            alerts.push({
                type: 'UNCLOSED_ATTENDANCE',
                severity: 'medium',
                employeeId: a.employee.id,
                employeeName: a.employee.name,
                detail: `Attendance started at ${a.startedAt.toISOString()} was never closed`,
            })
        }

        for (const t of overdueTasks) {
            alerts.push({
                type: 'OVERDUE_TASK',
                severity: 'high',
                employeeId: t.employee.id,
                employeeName: t.employee.name,
                detail: `Task "${t.title}" (id: ${t.id}) is marked NOT_DONE`,
            })
        }

        const activeEmployeeIds = new Set(recentAttendances.map(a => a.employeeId))
        for (const emp of allEmployees) {
            if (!activeEmployeeIds.has(emp.id)) {
                alerts.push({
                    type: 'NO_ACTIVITY',
                    severity: 'low',
                    employeeId: emp.id,
                    employeeName: emp.name,
                    detail: `No attendance recorded in the last 7 days`,
                })
            }
        }

        const tasksByEmployee = await prisma.task.groupBy({
            by: ['employeeId'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _count: { id: true },
        })

        const notDoneByEmployee = await prisma.task.groupBy({
            by: ['employeeId'],
            where: { createdAt: { gte: thirtyDaysAgo }, status: { name: 'NOT_DONE' } },
            _count: { id: true },
        })

        const notDoneMap = Object.fromEntries(
            notDoneByEmployee.map(r => [r.employeeId, r._count.id]),
        )

        const empMap = Object.fromEntries(allEmployees.map(e => [e.id, e.name]))

        for (const row of tasksByEmployee) {
            const notDone = notDoneMap[row.employeeId] ?? 0
            const ratio = notDone / row._count.id
            if (ratio > 0.3) {
                alerts.push({
                    type: 'HIGH_NOT_DONE_RATE',
                    severity: 'high',
                    employeeId: row.employeeId,
                    employeeName: empMap[row.employeeId] ?? 'Unknown',
                    detail: `${Math.round(ratio * 100)}% not-done rate in last 30 days (${notDone}/${row._count.id} tasks)`,
                })
            }
        }

        return alerts
    }
}

export const analyticsService = new AnalyticsService()
