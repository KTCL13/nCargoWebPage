/// <reference types="jest" />

jest.mock('../../repositories/attendance.repository', () => ({
    attendanceRepository: {
        findStaleOpenByEmployee: jest.fn(),
        findAllStaleOpen: jest.fn(),
        updateStatus: jest.fn(),
        findTodayByEmployee: jest.fn(),
        findActiveByEmployee: jest.fn(),
        create: jest.fn(),
    },
}))

jest.mock('../../repositories/attendance-event.repository', () => ({
    attendanceEventRepository: {
        create: jest.fn(),
        findByAttendance: jest.fn(),
    },
}))

jest.mock('@/modules/employees/repositories/employee.repository', () => ({
    employeeRepository: { getEmployeeById: jest.fn() },
}))

jest.mock('@/modules/analytics/services/analytics.service', () => ({
    analyticsService: { aggregateKPIs: jest.fn().mockResolvedValue(undefined) },
}))

jest.mock('@/lib/audit-logger', () => ({
    auditLog: jest.fn().mockResolvedValue(undefined),
}))

import { attendanceService } from '../attendance.service'
import { attendanceRepository } from '../../repositories/attendance.repository'
import { attendanceEventRepository } from '../../repositories/attendance-event.repository'
import { auditLog } from '@/lib/audit-logger'

const mocked = <T extends (...args: any) => any>(fn: T) => fn as unknown as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('attendanceService.closeAllStaleSessions', () => {
    it('G1 closes every stale row at 23:59:59 of its own day in its tz', async () => {
        const stale = {
            id: 42,
            employeeId: 7,
            // 2026-05-15 14:30 UTC (= 09:30 in America/Bogota, UTC-5)
            startedAt: new Date('2026-05-15T14:30:00.000Z'),
            timezone: 'America/Bogota',
            status: 'OPEN',
        }
        mocked(attendanceRepository.findAllStaleOpen).mockResolvedValue([stale])
        mocked(attendanceEventRepository.findByAttendance).mockResolvedValue([
            { type: 'CLOCK_IN', timestamp: stale.startedAt },
            // CLOCK_OUT will be appended right above
        ])
        mocked(attendanceEventRepository.create).mockResolvedValue({})
        mocked(attendanceRepository.updateStatus).mockResolvedValue({})

        const result = await attendanceService.closeAllStaleSessions()

        expect(result.closed).toBe(1)

        // CLOCK_OUT event timestamp = end of 2026-05-15 in Bogota
        // = 2026-05-16 04:59:59.999 UTC
        const clockOutCall = mocked(attendanceEventRepository.create).mock.calls[0][0]
        expect(clockOutCall.type).toBe('CLOCK_OUT')
        expect(clockOutCall.locationMetadata).toMatchObject({ autoClose: true })

        const ts: Date = clockOutCall.timestamp
        expect(ts.toISOString()).toBe('2026-05-16T04:59:59.999Z')

        // updateStatus called with the same end-of-day endedAt
        const updateCall = mocked(attendanceRepository.updateStatus).mock.calls[0]
        expect(updateCall[1]).toBe('CLOSED')
        expect(updateCall[2].endedAt.toISOString()).toBe('2026-05-16T04:59:59.999Z')

        // Audit log written with performedBy = null (system action)
        expect(auditLog).toHaveBeenCalledWith(
            expect.objectContaining({
                entityType: 'Attendance',
                entityId: 42,
                action: 'AUTO_CLOSE',
                performedBy: null,
            }),
        )
    })

    it('G2 no stale rows → closed: 0, no writes', async () => {
        mocked(attendanceRepository.findAllStaleOpen).mockResolvedValue([])
        const result = await attendanceService.closeAllStaleSessions()
        expect(result.closed).toBe(0)
        expect(attendanceEventRepository.create).not.toHaveBeenCalled()
        expect(attendanceRepository.updateStatus).not.toHaveBeenCalled()
    })

    it('G3 multiple rows in different timezones — each closed at its own local 23:59', async () => {
        const rowBogota = {
            id: 1,
            employeeId: 1,
            startedAt: new Date('2026-05-15T20:00:00.000Z'),
            timezone: 'America/Bogota', // UTC-5
            status: 'OPEN',
        }
        const rowMx = {
            id: 2,
            employeeId: 2,
            startedAt: new Date('2026-05-15T20:00:00.000Z'),
            timezone: 'America/Mexico_City', // UTC-6
            status: 'PAUSED',
        }
        mocked(attendanceRepository.findAllStaleOpen).mockResolvedValue([rowBogota, rowMx])
        mocked(attendanceEventRepository.findByAttendance).mockResolvedValue([])
        mocked(attendanceEventRepository.create).mockResolvedValue({})
        mocked(attendanceRepository.updateStatus).mockResolvedValue({})

        const result = await attendanceService.closeAllStaleSessions()

        expect(result.closed).toBe(2)

        const tsBogota: Date = mocked(attendanceEventRepository.create).mock.calls[0][0].timestamp
        const tsMx: Date = mocked(attendanceEventRepository.create).mock.calls[1][0].timestamp

        // Bogota end-of-day (2026-05-15 23:59:59.999 BOG = 2026-05-16 04:59:59.999 UTC)
        expect(tsBogota.toISOString()).toBe('2026-05-16T04:59:59.999Z')
        // Mexico City end-of-day (2026-05-15 23:59:59.999 MX = 2026-05-16 05:59:59.999 UTC)
        expect(tsMx.toISOString()).toBe('2026-05-16T05:59:59.999Z')
    })
})
