import { NextRequest } from 'next/server'
import { cotizacionesController } from '@/modules/cotizaciones/controllers/cotizaciones.controller'

export const GET = (req: NextRequest) => cotizacionesController.ciudades(req)
