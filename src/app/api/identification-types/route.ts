import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthEmployee } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  try { getAuthEmployee(req) } catch (e) {
    return NextResponse.json({ message: (e as Error).message }, { status: 401 })
  }
  const data = await prisma.identificationType.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json(data)
}
