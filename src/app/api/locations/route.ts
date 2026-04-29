import { NextRequest } from 'next/server'
import { locationController } from '@/modules/shipping/controllers/location.controller'

export const GET = (req: NextRequest) => locationController.findByCountry(req)
