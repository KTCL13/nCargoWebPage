import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { register } from '@/lib/metrics'

// Prometheus scrape endpoint — restricted to admins
export async function GET(req: NextRequest) {
    try {
        await requireAdmin(req)
    } catch {
        return NextResponse.json({ message: 'No autorizado' }, { status: 401 })
    }

    const metrics = await register.metrics()
    return new NextResponse(metrics, {
        status: 200,
        headers: { 'Content-Type': register.contentType },
    })
}
