import { NextRequest } from 'next/server'
import { analyticsController } from '@/modules/analytics/controllers/analytics.controller'

export const dynamic = 'force-dynamic'


export async function GET(req: NextRequest) {
    return analyticsController.getAlerts(req)
}
