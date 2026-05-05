import { attendanceRepository } from '../repositories/attendance.repository'
import { attendanceEventRepository } from '../repositories/attendance-event.repository'
import { employeeRepository } from '@/modules/employees/repositories/employee.repository'
import { auditLog } from '@/lib/audit-logger'
import { Attendance, AttendanceEvent, AttendanceStatus } from '@prisma/client'

type AttendanceWithEvents = Attendance & { events: AttendanceEvent[] }

function computeWorkedHours(events: AttendanceEvent[]): number {
    let totalMs = 0
    let clockInTime: Date | null = null

    for (const event of events) {
        if (event.type === 'CLOCK_IN' || event.type === 'RESUME') {
            clockInTime = event.timestamp
        } else if ((event.type === 'PAUSE' || event.type === 'CLOCK_OUT') && clockInTime) {
            totalMs += event.timestamp.getTime() - clockInTime.getTime()
            clockInTime = null
        }
    }

    return Math.round((totalMs / 3_600_000) * 100) / 100
}

function extractClockInIp(events: AttendanceEvent[]): string | null {
    const clockIn = events.find(e => e.type === 'CLOCK_IN')
    if (!clockIn || !clockIn.locationMetadata) return null
    return (clockIn.locationMetadata as Record<string, unknown>).ip as string | null
}

class AttendanceService {
    async clockIn(employeeId: number, ip: string): Promise<AttendanceWithEvents> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'

        const existing = await attendanceRepository.findTodayByEmployee(employeeId, timezone)
        if (existing) {
            throw new Error('El empleado ya tiene una asistencia activa hoy')
        }

        const attendance = await attendanceRepository.create({
            employeeId,
            startedAt: new Date(),
            timezone,
        })

        const event = await attendanceEventRepository.create({
            attendanceId: attendance.id,
            type: 'CLOCK_IN',
            locationMetadata: { ip },
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendance.id,
            action: 'CLOCK_IN',
            performedBy: employeeId,
            newValues: { ip, startedAt: attendance.startedAt },
        })

        return { ...attendance, events: [event] }
    }

    async pause(employeeId: number, ip: string): Promise<AttendanceWithEvents> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'
        const attendance = await attendanceRepository.findActiveByEmployee(employeeId, timezone)
        if (!attendance || attendance.status !== 'OPEN') {
            throw new Error('No hay una sesión activa para pausar')
        }

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        const clockInIp = extractClockInIp(events)
        if (clockInIp && clockInIp !== ip) {
            throw new Error('IP no coincide con la sesión activa')
        }

        const updated = await attendanceRepository.updateStatus(attendance.id, 'PAUSED')
        const event = await attendanceEventRepository.create({
            attendanceId: attendance.id,
            type: 'PAUSE',
            locationMetadata: { ip },
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendance.id,
            action: 'PAUSE',
            performedBy: employeeId,
            newValues: { ip },
        })

        return { ...updated, events: [...events, event] }
    }

    async resume(employeeId: number, ip: string): Promise<AttendanceWithEvents> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'
        const attendance = await attendanceRepository.findActiveByEmployee(employeeId, timezone)
        if (!attendance || attendance.status !== 'PAUSED') {
            throw new Error('No hay una sesión pausada para reanudar')
        }

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        const clockInIp = extractClockInIp(events)
        if (clockInIp && clockInIp !== ip) {
            throw new Error('IP no coincide con la sesión activa')
        }

        const updated = await attendanceRepository.updateStatus(attendance.id, 'OPEN')
        const event = await attendanceEventRepository.create({
            attendanceId: attendance.id,
            type: 'RESUME',
            locationMetadata: { ip },
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendance.id,
            action: 'RESUME',
            performedBy: employeeId,
            newValues: { ip },
        })

        return { ...updated, events: [...events, event] }
    }

    async clockOut(employeeId: number, ip: string): Promise<AttendanceWithEvents> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'
        const attendance = await attendanceRepository.findActiveByEmployee(employeeId, timezone)
        if (!attendance) {
            throw new Error('No hay una sesión activa para cerrar')
        }

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        const clockInIp = extractClockInIp(events)
        if (clockInIp && clockInIp !== ip) {
            throw new Error('IP no coincide con la sesión activa')
        }

        const clockOutEvent = await attendanceEventRepository.create({
            attendanceId: attendance.id,
            type: 'CLOCK_OUT',
            locationMetadata: { ip },
        })

        const allEvents = [...events, clockOutEvent]
        const workedHours = computeWorkedHours(allEvents)
        const endedAt = new Date()

        const updated = await attendanceRepository.updateStatus(attendance.id, 'CLOSED', {
            endedAt,
            workedHours,
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendance.id,
            action: 'CLOCK_OUT',
            performedBy: employeeId,
            newValues: { ip, endedAt, workedHours },
        })

        return { ...updated, events: allEvents }
    }

    async getToday(employeeId: number): Promise<AttendanceWithEvents | null> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'
        const attendance = await attendanceRepository.findTodayByEmployee(employeeId, timezone)
        if (!attendance) return null

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        return { ...attendance, events }
    }

    async getHistory(
        employeeId: number,
        page: number,
        limit: number,
    ): Promise<{ data: AttendanceWithEvents[]; total: number; page: number; limit: number }> {
        const { data, total } = await attendanceRepository.findByEmployee(employeeId, page, limit)
        return { data: data as AttendanceWithEvents[], total, page, limit }
    }

    async getAllFiltered(filters: {
        date?: string
        employeeId?: number
        status?: AttendanceStatus
        page: number
        limit: number
    }) {
        return attendanceRepository.findAllFiltered(filters)
    }

    async forceClose(attendanceId: number, adminId: number) {
        const attendance = await attendanceRepository.findById(attendanceId)
        if (!attendance) throw new Error('Jornada no encontrada')
        if (attendance.status === 'CLOSED') throw new Error('La jornada ya está cerrada')

        const now = new Date()
        
        // Add a manual clock out event
        await attendanceEventRepository.create({
            attendanceId,
            type: 'CLOCK_OUT',
            locationMetadata: { manualClose: true, closedBy: adminId },
            timestamp: now
        })

        const events = await attendanceEventRepository.findByAttendance(attendanceId)
        const workedHours = computeWorkedHours(events)

        const updated = await attendanceRepository.updateStatus(attendanceId, 'CLOSED', {
            endedAt: now,
            workedHours
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendanceId,
            action: 'MANUAL_CLOSE',
            performedBy: adminId,
            newValues: { status: 'CLOSED', endedAt: now, workedHours }
        })

        return updated
    }
}

export const attendanceService = new AttendanceService()
