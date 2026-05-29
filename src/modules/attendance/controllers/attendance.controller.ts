import { NextRequest, NextResponse } from 'next/server'
import { attendanceService } from '../services/attendance.service'
import { getAuthEmployee } from '@/lib/auth-guard'
import { getIp } from '@/lib/get-ip'

class AttendanceController {
    async clockIn(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const ip = getIp(req)
            const result = await attendanceService.clockIn(employee.id, ip)
            return NextResponse.json(result, { status: 201 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401
                : error instanceof Error && error.message.includes('IP') ? 403 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async pause(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const ip = getIp(req)
            const result = await attendanceService.pause(employee.id, ip)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401
                : error instanceof Error && error.message.includes('IP') ? 403 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async resume(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const ip = getIp(req)
            const result = await attendanceService.resume(employee.id, ip)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401
                : error instanceof Error && error.message.includes('IP') ? 403 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async clockOut(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const ip = getIp(req)
            const result = await attendanceService.clockOut(employee.id, ip)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401
                : error instanceof Error && error.message.includes('IP') ? 403 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async getToday(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const url = new URL(req.url)
            const employeeIdParam = url.searchParams.get('employeeId')
            if (employeeIdParam && employee.role !== 'ADMIN') {
                return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
            }
            const employeeId = employeeIdParam ? Number(employeeIdParam) : employee.id
            const result = await attendanceService.getToday(employeeId)
            return NextResponse.json(result ?? null, { status: 200 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }

    async getHistory(req: NextRequest) {
        try {
            const employee = await getAuthEmployee(req)
            const url = new URL(req.url)
            const employeeIdParam = url.searchParams.get('employeeId')
            if (employeeIdParam && employee.role !== 'ADMIN') {
                return NextResponse.json({ message: 'Acceso denegado' }, { status: 403 })
            }
            const employeeId = employeeIdParam ? Number(employeeIdParam) : employee.id
            const page = Number(url.searchParams.get('page') ?? '1')
            const limit = Number(url.searchParams.get('limit') ?? '10')
            const fromParam = url.searchParams.get('from')
            const toParam = url.searchParams.get('to')
            const from = fromParam ? new Date(fromParam + 'T00:00:00') : undefined
            const to = toParam ? new Date(toParam + 'T23:59:59.999') : undefined
            const result = await attendanceService.getHistory(employeeId, page, limit, from, to)
            return NextResponse.json(result, { status: 200 })
        } catch (error: unknown) {
            const status = error instanceof Error && error.message.includes('Token') ? 401 : 400
            return NextResponse.json(
                { message: error instanceof Error ? error.message : 'Error interno del servidor' },
                { status },
            )
        }
    }
}

export const attendanceController = new AttendanceController()
