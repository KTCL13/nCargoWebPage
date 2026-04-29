import { NextRequest } from 'next/server'
import { analyticsController } from '@/modules/analytics/controllers/analytics.controller'

export async function GET(req: NextRequest) {
    return analyticsController.getEmployeePerformance(req)
}
