import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth-guard'

function authError(error: unknown) {
  const status =
    error instanceof Error && error.message.startsWith('Forbidden')
      ? 403
      : error instanceof Error && error.message.includes('Token')
        ? 401
        : 400
  return NextResponse.json(
    { message: error instanceof Error ? error.message : 'No autorizado' },
    { status },
  )
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req)
  } catch (error) {
    return authError(error)
  }
  const data = await prisma.systemConfig.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json({ data, total: data.length })
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req)
  } catch (error) {
    return authError(error)
  }
  try {
    const body: { key: string; value: string }[] = await req.json()
    if (!Array.isArray(body)) {
      return NextResponse.json({ message: 'Expected an array of { key, value }' }, { status: 400 })
    }
    await Promise.all(
      body.map(({ key, value }) =>
        prisma.systemConfig.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 },
    )
  }
}
