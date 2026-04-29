import { NextRequest } from 'next/server'
import { shippingProviderController } from '@/modules/shipping/controllers/shipping-provider.controller'

export const GET = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  params.then(p => shippingProviderController.getRates(req, Number(p.id)))

export const POST = (req: NextRequest, { params }: { params: Promise<{ id: string }> }) =>
  params.then(p => shippingProviderController.createRate(req, Number(p.id)))
