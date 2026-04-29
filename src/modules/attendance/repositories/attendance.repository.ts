import { prisma } from '@/lib/prisma'
import { Attendance, AttendanceStatus } from '@prisma/client'

function startOfToday(): Date {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

class AttendanceRepository {
    async findTodayByEmployee(employeeId: number): Promise<Attendance | null> {
        return prisma.attendance.findFirst({
            where: { employeeId, startedAt: { gte: startOfToday() } },
            orderBy: { startedAt: 'desc' },
        })
    }

    async findActiveByEmployee(employeeId: number): Promise<Attendance | null> {
        return prisma.attendance.findFirst({
            where: {
                employeeId,
                startedAt: { gte: startOfToday() },
                status: { in: ['OPEN', 'PAUSED'] },
            },
            orderBy: { startedAt: 'desc' },
        })
    }

    async create(data: { employeeId: number; startedAt: Date }): Promise<Attendance> {
        return prisma.attendance.create({ data: { ...data, status: 'OPEN' } })
    }

    async updateStatus(
        id: number,
        status: AttendanceStatus,
        extra?: { endedAt?: Date; workedHours?: number },
    ): Promise<Attendance> {
        return prisma.attendance.update({
            where: { id },
            data: { status, ...extra },
        })
    }

    async findByEmployee(
        employeeId: number,
        page: number,
        limit: number,
    ): Promise<{ data: Attendance[]; total: number }> {
        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where: { employeeId },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { startedAt: 'desc' },
                include: { events: { orderBy: { timestamp: 'asc' } } },
            }),
            prisma.attendance.count({ where: { employeeId } }),
        ])
        return { data, total }
    }

    async findAllFiltered(filters: {
        date?: string
        employeeId?: number
        status?: AttendanceStatus
        page: number
        limit: number
    }): Promise<{ data: Attendance[]; total: number }> {
        const where: any = {}
        if (filters.date) {
            const start = new Date(filters.date)
            start.setHours(0, 0, 0, 0)
            const end = new Date(filters.date)
            end.setHours(23, 59, 59, 999)
            where.startedAt = { gte: start, lte: end }
        }
        if (filters.employeeId) where.employeeId = filters.employeeId
        if (filters.status) where.status = filters.status

        const [data, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip: (filters.page - 1) * filters.limit,
                take: filters.limit,
                orderBy: { startedAt: 'desc' },
            }),
            prisma.attendance.count({ where }),
        ])
        return { data, total }
    }

    async findById(id: number): Promise<Attendance | null> {
        return prisma.attendance.findUnique({ where: { id } })
    }
}

export const attendanceRepository = new AttendanceRepository()
