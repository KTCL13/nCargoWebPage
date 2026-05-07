import { NextRequest } from 'next/server'
import { odooLockerController } from '@/modules/shipping/controllers/odoo-locker.controller'

export async function POST(req: NextRequest) {
  return odooLockerController.syncLockers(req)
}
