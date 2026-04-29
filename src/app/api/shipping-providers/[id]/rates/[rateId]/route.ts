import { NextRequest } from 'next/server'
import { shippingProviderController } from '@/modules/shipping/controllers/shipping-provider.controller'

export const PATCH = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rateId: string }> },
) => params.then(p => shippingProviderController.updateRate(req, Number(p.id), Number(p.rateId)))

export const DELETE = (
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rateId: string }> },
) => params.then(p => shippingProviderController.deleteRate(req, Number(p.id), Number(p.rateId)))
