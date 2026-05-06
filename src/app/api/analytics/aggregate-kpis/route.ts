import { NextRequest } from 'next/server'
import { analyticsController } from '@/modules/analytics/controllers/analytics.controller'

export async function POST(req: NextRequest) {
    return analyticsController.aggregateKPIs(req)
}
