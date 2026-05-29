import { attendanceRepository } from '../repositories/attendance.repository'
import { attendanceEventRepository } from '../repositories/attendance-event.repository'
import { employeeRepository } from '@/modules/employees/repositories/employee.repository'
import { analyticsService } from '@/modules/analytics/services/analytics.service'
import { auditLog } from '@/lib/audit-logger'
import { Attendance, AttendanceEvent, AttendanceStatus } from '@prisma/client'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { endOfDay } from 'date-fns'

// Returns the instant equal to 23:59:59.999 of `date`'s calendar day in `timezone`.
function endOfDayInTimezone(date: Date, timezone: string): Date {
    const zoned = toZonedTime(date, timezone)
    const endZoned = endOfDay(zoned)
    return fromZonedTime(endZoned, timezone)
}

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
    // Closes ONE stale attendance, stamping CLOCK_OUT at end-of-day of the
    // session's startedAt (in the given timezone), not at "now". This keeps
    // workedHours and endedAt consistent whether the session is closed by the
    // cron job at midnight or lazily on the employee's next interaction.
    private async closeStaleAttendance(
        attendance: Attendance,
        timezone: string,
        performedBy: number | null,
    ): Promise<void> {
        const endedAt = endOfDayInTimezone(attendance.startedAt, timezone)

        await attendanceEventRepository.create({
            attendanceId: attendance.id,
            type: 'CLOCK_OUT',
            locationMetadata: { autoClose: true, reason: 'Cierre automático a las 23:59 del día' },
            timestamp: endedAt,
        })

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        const workedHours = computeWorkedHours(events)

        await attendanceRepository.updateStatus(attendance.id, 'CLOSED', {
            endedAt,
            workedHours,
        })

        await auditLog({
            entityType: 'Attendance',
            entityId: attendance.id,
            action: 'AUTO_CLOSE',
            performedBy,
            newValues: { status: 'CLOSED', endedAt, workedHours, reason: 'Cierre automático fin de día' },
        })

        const day = new Date(attendance.startedAt)
        day.setHours(0, 0, 0, 0)
        analyticsService
            .aggregateKPIs({ employeeId: attendance.employeeId, from: day, to: day })
            .catch(() => {})
    }

    private async autoCloseStaleSessions(employeeId: number, timezone: string): Promise<void> {
        const stale = await attendanceRepository.findStaleOpenByEmployee(employeeId, timezone)
        for (const attendance of stale) {
            await this.closeStaleAttendance(attendance, timezone, employeeId)
        }
    }

    // Cron entry-point: closes every stale OPEN/PAUSED attendance across all
    // employees, each one at 23:59:59 of its own day in its own timezone.
    async closeAllStaleSessions(): Promise<{ closed: number }> {
        const stale = await attendanceRepository.findAllStaleOpen()
        let closed = 0
        for (const row of stale) {
            const tz = row.timezone || 'America/Bogota'
            await this.closeStaleAttendance(row, tz, null)
            closed++
        }
        return { closed }
    }

    async clockIn(employeeId: number, ip: string): Promise<AttendanceWithEvents> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'

        await this.autoCloseStaleSessions(employeeId, timezone)

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

        await this.autoCloseStaleSessions(employeeId, timezone)

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

        await this.autoCloseStaleSessions(employeeId, timezone)

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

        await this.autoCloseStaleSessions(employeeId, timezone)

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

        // Fire-and-forget: populate EmployeeKPI for today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        analyticsService.aggregateKPIs({ employeeId, from: today, to: today }).catch(() => {})

        return { ...updated, events: allEvents }
    }

    async getToday(employeeId: number): Promise<AttendanceWithEvents | null> {
        const emp = await employeeRepository.getEmployeeById(employeeId)
        const timezone = emp?.timezone ?? 'America/Bogota'

        await this.autoCloseStaleSessions(employeeId, timezone)

        const attendance = await attendanceRepository.findTodayByEmployee(employeeId, timezone)
        if (!attendance) return null

        const events = await attendanceEventRepository.findByAttendance(attendance.id)
        return { ...attendance, events }
    }

    async getHistory(
        employeeId: number,
        page: number,
        limit: number,
        from?: Date,
        to?: Date,
    ): Promise<{ data: AttendanceWithEvents[]; total: number; page: number; limit: number }> {
        const { data, total } = await attendanceRepository.findByEmployee(employeeId, page, limit, from, to)
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

        // Fire-and-forget: update EmployeeKPI for the affected day
        const day = new Date(attendance.startedAt)
        day.setHours(0, 0, 0, 0)
        analyticsService.aggregateKPIs({ employeeId: attendance.employeeId, from: day, to: day }).catch(() => {})

        return updated
    }
}

export const attendanceService = new AttendanceService()
