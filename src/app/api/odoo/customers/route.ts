import { NextRequest, NextResponse } from 'next/server'
import { searchPartners } from '@/lib/odoo'
import { getAuthEmployee } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try {
    await getAuthEmployee(req)
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? ''
    if (q.length < 3) return NextResponse.json([])

    const partners = await searchPartners(q)

    const data = partners.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email || '',
      vat: p.vat || '',
      phone: p.phone || '',
    }))

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error consultando Odoo' },
      { status: 400 },
    )
  }
}
