import { NextRequest } from 'next/server'
import { odooLockerController } from '@/modules/shipping/controllers/odoo-locker.controller'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return odooLockerController.getLockerShipments(req, parseInt(id))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return odooLockerController.createLockerShipment(req, parseInt(id))
}
