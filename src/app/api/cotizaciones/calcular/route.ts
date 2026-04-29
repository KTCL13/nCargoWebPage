import { NextRequest } from 'next/server'
import { cotizacionesController } from '@/modules/cotizaciones/controllers/cotizaciones.controller'

export const POST = (req: NextRequest) => cotizacionesController.calcular(req)
