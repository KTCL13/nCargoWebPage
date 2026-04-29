import { NextRequest, NextResponse } from 'next/server'

// Mock de clientes de Odoo para demostración
const MOCK_CUSTOMERS = [
  { id: 101, name: 'Juan Pérez', email: 'juan.perez@example.com', vat: '12345678' },
  { id: 102, name: 'María García', email: 'm.garcia@test.com', vat: '87654321' },
  { id: 103, name: 'Carlos López', email: 'clopez@empresa.co', vat: '11223344' },
  { id: 104, name: 'Ana Martínez', email: 'ana.mtz@mail.com', vat: '55667788' },
  { id: 105, name: 'Logística Avanzada SAS', email: 'contacto@logistica.com', vat: '900123456' },
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.toLowerCase() || ''

  if (!q) {
    return NextResponse.json([])
  }

  // Simular búsqueda por nombre, email o cédula (vat)
  const filtered = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(q) || 
    c.email.toLowerCase().includes(q) || 
    c.vat.includes(q)
  )

  // Simular retraso de red
  await new Promise(resolve => setTimeout(resolve, 500))

  return NextResponse.json(filtered)
}
