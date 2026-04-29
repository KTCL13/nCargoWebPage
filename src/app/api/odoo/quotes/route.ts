import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, quotationData } = body

    if (!customerId) {
      return NextResponse.json({ message: 'Cliente no seleccionado' }, { status: 400 })
    }

    // Aquí iría la lógica real de conexión con Odoo vía XML-RPC o JSON-RPC
    // Por ahora simulamos una respuesta exitosa
    
    console.log('Enviando a Odoo:', { customerId, quotationData })

    // Simular retraso de red
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Opcionalmente guardar la cotización en nuestra base de datos local vinculada a Odoo
    // const newQuotation = await prisma.quotation.create({
    //   data: {
    //     ...
    //     odooCustomerId: customerId,
    //     ...
    //   }
    // })

    return NextResponse.json({ 
      success: true, 
      odooOrderId: Math.floor(Math.random() * 10000),
      message: 'Cotización enviada a Odoo exitosamente' 
    })

  } catch (error) {
    console.error('Error al enviar a Odoo:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}
