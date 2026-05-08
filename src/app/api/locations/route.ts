import { NextRequest } from 'next/server'
import { locationController } from '@/modules/shipping/controllers/location.controller'

export const GET  = (req: NextRequest) => locationController.findAll(req)
export const POST = (req: NextRequest) => locationController.create(req)
