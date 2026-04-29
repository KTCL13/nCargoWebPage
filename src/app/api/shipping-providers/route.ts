import { NextRequest } from 'next/server'
import { shippingProviderController } from '@/modules/shipping/controllers/shipping-provider.controller'

export const GET = (req: NextRequest) => shippingProviderController.findAll(req)
