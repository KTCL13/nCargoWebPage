import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const getPrisma = () => {
  // Evitar inicialización durante el build de Next.js
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return null as unknown as PrismaClient;
  }

  if (globalForPrisma.prisma) return globalForPrisma.prisma
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  
  return client
}

export const prisma = globalForPrisma.prisma || getPrisma()




