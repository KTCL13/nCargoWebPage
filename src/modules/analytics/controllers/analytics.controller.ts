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

            const data = await analyticsService.getEmployeePerformance({ employeeId, from, to })
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
