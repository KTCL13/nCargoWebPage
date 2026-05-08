import { NextRequest } from 'next/server'
import { locationController } from '@/modules/shipping/controllers/location.controller'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return locationController.update(req, Number(id))
}
