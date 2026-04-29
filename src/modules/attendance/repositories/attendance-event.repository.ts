import { prisma } from '@/lib/prisma'
import { AttendanceEvent, AttendanceEventType } from '@prisma/client'
import { InputJsonValue } from '@prisma/client/runtime/library'

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
                locationMetadata: data.locationMetadata as InputJsonValue | undefined,
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
