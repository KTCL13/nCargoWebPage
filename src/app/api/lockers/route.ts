import { NextRequest } from 'next/server'
import { odooLockerController } from '@/modules/shipping/controllers/odoo-locker.controller'

export async function GET(req: NextRequest) {
  return odooLockerController.getLockers(req)
}
