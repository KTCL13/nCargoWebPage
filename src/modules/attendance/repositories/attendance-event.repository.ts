import { prisma } from '@/lib/prisma'
import { AttendanceEvent, AttendanceEventType, Prisma } from '@prisma/client'


class AttendanceEventRepository {
    async create(data: {
        attendanceId: number
        type: AttendanceEventType
        locationMetadata?: Record<string, unknown>
        timestamp?: Date
    }): Promise<AttendanceEvent> {
        return prisma.attendanceEvent.create({
            data: {
                attendanceId: data.attendanceId,
                type: data.type,
                locationMetadata: data.locationMetadata as Prisma.InputJsonValue | undefined,
                timestamp: data.timestamp,
            },
        })
    }

    async findByAttendance(attendanceId: number): Promise<AttendanceEvent[]> {
        return prisma.attendanceEvent.findMany({
            where: { attendanceId },
            orderBy: { timestamp: 'asc' },
        })
    }
}

export const attendanceEventRepository = new AttendanceEventRepository()
