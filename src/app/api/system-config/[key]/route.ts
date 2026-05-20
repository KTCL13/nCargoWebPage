import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    requireAdmin(req)
    const { key } = await params
    const body = await req.json()
    if (body.value === undefined) {
      return NextResponse.json({ message: 'Campo "value" requerido' }, { status: 400 })
    }
    const record = await prisma.systemConfig.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value },
    })
    return NextResponse.json(record)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno'
    const status =
      msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('token')
        ? 401
        : 500
    return NextResponse.json({ message: msg }, { status })
  }
}
