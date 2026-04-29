import { NextRequest } from 'next/server'
import { quotationController } from '@/modules/quotations/controllers/quotation.controller'

export async function POST(req: NextRequest) {
    const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true'
    return dryRun
        ? quotationController.calculateSimple(req)
        : quotationController.createSimple(req)
}
