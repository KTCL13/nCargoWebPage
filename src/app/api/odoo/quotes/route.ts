import { NextRequest, NextResponse } from 'next/server'
import { createSaleOrder, getShippingProductId } from '@/lib/odoo'

type Breakdown = {
  total: number
  transport: number
  volumetricSurcharge: number
  insurance: number
  customs: number
  cityDelivery: number
  pickup: number
  detail: {
    actualWeightLb: number
    volumetricWeightLb: number
    chargeableWeightLb: number
    flatRateApplied: boolean
    cityName: string | null
  }
}

function buildDescription(country: string | undefined, q: Breakdown): string {
  const dest = country === 'MX' ? 'México' : country === 'CO' ? 'Colombia' : 'Internacional'
  const city = q.detail.cityName ?? 'Tarifa única'
  const usd = (n: number) => `USD ${n.toFixed(2)}`

  return [
    `Servicio de envío USA → ${dest}`,
    `Destino: ${city}`,
    ``,
    `Pesos (lb): ${q.detail.actualWeightLb} real · ${q.detail.volumetricWeightLb} volumétrico · ${q.detail.chargeableWeightLb} facturable`,
    ``,
    `Desglose:`,
    `  • Transporte: ${usd(q.transport)}`,
    `  • Recargo volumétrico: ${usd(q.volumetricSurcharge)}`,
    `  • Seguro: ${usd(q.insurance)}`,
    `  • Aduana: ${usd(q.customs)}`,
    `  • Entrega en ciudad: ${usd(q.cityDelivery)}`,
    `  • Recogida: ${usd(q.pickup)}`,
    ``,
    `Total cotización: ${usd(q.total)}`,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customerId, quotationData, country } = body as {
      customerId: number
      quotationData: Breakdown
      country?: 'CO' | 'MX'
    }

    if (!customerId) {
      return NextResponse.json({ message: 'Cliente no seleccionado' }, { status: 400 })
    }
    if (!quotationData?.total) {
      return NextResponse.json({ message: 'Cotización inválida' }, { status: 400 })
    }

    const productId = await getShippingProductId()

    const result = await createSaleOrder(customerId, productId, {
      description: buildDescription(country, quotationData),
      quantity: 1,
      priceUnit: quotationData.total,
    })

    return NextResponse.json({
      success: true,
      odooOrderId: result.orderId,
      odooOrderName: result.name,
      total: result.total,
      message: `Cotización ${result.name} creada en Odoo`,
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Error interno' },
      { status: 400 },
    )
  }
}
