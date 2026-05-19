import { prisma } from '@/lib/prisma'
import { Attendance, AttendanceStatus } from '@prisma/client'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay } from 'date-fns'

function getStartOfDayForEmployee(timezone: string): Date {
    const nowInTz = toZonedTime(new Date(), timezone)
    const midnightInTz = startOfDay(nowInTz)
    return fromZonedTime(midnightInTz, timezone)
}

class AttendanceRepository {
    async findTodayByEmployee(employeeId: number, timezone: string): Promise<Attendance | null> {
        return prisma.attendance.findFirst({
            where: { employeeId, startedAt: { gte: getStartOfDayForEmployee(timezone) } },
            orderBy: { startedAt: 'desc' },
        })
    }

    async findActiveByEmployee(employeeId: number, timezone: string): Promise<Attendance | null> {
        return prisma.attendance.findFirst({
            where: {
                employeeId,
                startedAt: { gte: getStartOfDayForEmployee(timezone) },
                status: { in: ['OPEN', 'PAUSED'] },
            },
            orderBy: { startedAt: 'desc' },
        })
    }

    async findStaleOpenByEmployee(employeeId: number, timezone: string): Promise<Attendance[]> {
        return prisma.attendance.findMany({
            where: {
                employeeId,
                startedAt: { lt: getStartOfDayForEmployee(timezone) },
                status: { in: ['OPEN', 'PAUSED'] },
            },
            orderBy: { startedAt: 'asc' },
        })
    }

    async create(data: { employeeId: number; startedAt: Date; timezone: string }): Promise<Attendance> {
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
            // Append time to force local-day parsing and avoid UTC shifts
            const start = new Date(filters.date + 'T00:00:00')
            const end = new Date(filters.date + 'T23:59:59.999')
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
