import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-guard'
import { getCotizacionAnalytics } from '../services/cotizacion-analytics.service'

export async function cotizacionAnalyticsController(req: NextRequest) {
  try {
    await requireAdmin(req)
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') ?? undefined
    const to = searchParams.get('to') ?? undefined
    const country = searchParams.get('country') ?? undefined
    const data = await getCotizacionAnalytics({ from, to, country })
    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return NextResponse.json({ message }, { status: 400 })
  }
}
