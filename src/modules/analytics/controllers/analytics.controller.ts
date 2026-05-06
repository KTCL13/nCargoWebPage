import { NextRequest, NextResponse } from 'next/server'
import { analyticsService } from '../services/analytics.service'
import { getAuthEmployee } from '@/lib/auth-guard'

class AnalyticsController {
    private parseDate(value: string | null): Date | undefined {
        if (!value) return undefined
        const d = new Date(value)
        return isNaN(d.getTime()) ? undefined : d
    }

    async getEmployeePerformance(req: NextRequest): Promise<NextResponse> {
        try {
            getAuthEmployee(req)
            const { searchParams } = new URL(req.url)
            const employeeId = searchParams.get('employeeId')
                ? Number(searchParams.get('employeeId'))
                : undefined
            const from = this.parseDate(searchParams.get('from'))
            const to = this.parseDate(searchParams.get('to'))
            const page = searchParams.get('page') ? Math.max(1, Number(searchParams.get('page'))) : 1
            const limit = searchParams.get('limit') ? Math.min(100, Math.max(1, Number(searchParams.get('limit')))) : 10

            const data = await analyticsService.getEmployeePerformance({ employeeId, from, to, page, limit })
            return NextResponse.json(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error'
            const status = message.includes('Token') ? 401 : 400
            return NextResponse.json({ message }, { status })
        }
    }

    async getTaskCompletionTimes(req: NextRequest): Promise<NextResponse> {
        try {
            getAuthEmployee(req)
            const { searchParams } = new URL(req.url)
            const employeeId = searchParams.get('employeeId')
                ? Number(searchParams.get('employeeId'))
                : undefined
            const from = this.parseDate(searchParams.get('from'))
            const to = this.parseDate(searchParams.get('to'))

            const data = await analyticsService.getTaskCompletionTimes({ employeeId, from, to })
            return NextResponse.json(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error'
            const status = message.includes('Token') ? 401 : 400
            return NextResponse.json({ message }, { status })
        }
    }

    async getWorkloadDistribution(req: NextRequest): Promise<NextResponse> {
        try {
            getAuthEmployee(req)
            const { searchParams } = new URL(req.url)
            const from = this.parseDate(searchParams.get('from'))
            const to = this.parseDate(searchParams.get('to'))

            const data = await analyticsService.getWorkloadDistribution({ from, to })
            return NextResponse.json(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error'
            const status = message.includes('Token') ? 401 : 400
            return NextResponse.json({ message }, { status })
        }
    }

    async aggregateKPIs(req: NextRequest): Promise<NextResponse> {
        try {
            getAuthEmployee(req)
            const body = await req.json().catch(() => ({}))
            const result = await analyticsService.aggregateKPIs({
                employeeId: body.employeeId ? Number(body.employeeId) : undefined,
                from:       body.from ? new Date(body.from) : undefined,
                to:         body.to   ? new Date(body.to)   : undefined,
                backfill:   body.backfill === true,
            })
            return NextResponse.json(result)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error'
            const status = message.includes('Token') ? 401 : 400
            return NextResponse.json({ message }, { status })
        }
    }

    async getAlerts(req: NextRequest): Promise<NextResponse> {
        try {
            getAuthEmployee(req)
            const data = await analyticsService.getAlerts()
            return NextResponse.json(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error'
            const status = message.includes('Token') ? 401 : 400
            return NextResponse.json({ message }, { status })
        }
    }
}

export const analyticsController = new AnalyticsController()
