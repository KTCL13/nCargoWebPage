import { NextRequest } from 'next/server'
import { contractExportController } from '@/modules/employees/controllers/contract-export.controller'

export async function POST(req: NextRequest) {
  return contractExportController.export(req)
}
