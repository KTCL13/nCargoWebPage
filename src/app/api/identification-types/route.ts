import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const data = await prisma.identificationType.findMany({ orderBy: { code: 'asc' } })
  return NextResponse.json(data)
}
