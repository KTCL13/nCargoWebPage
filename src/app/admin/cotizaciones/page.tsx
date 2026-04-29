'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'

const LIMIT = 10

type Quotation = {
  id: number
  employee_id: number
  odoo_customer_id?: number
  pickup_point_id?: number
  status_id: number
  destination_location?: {
    address?: string
    city?: string
  }
  calculated_distance_miles: number
  weight_lbs: number
  pickup_price: number
  shipping_price: number
  packaging_price: number
  subtotal: number
  tax_amount: number
  total: number
  created_at: string
  employee?: { name: string }
  status?: { name: string; color?: string }
}

export default function CotizacionesPage() {
  const router = useRouter()

  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchQuotations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
        ...(search && { search }),
      })

      const res = await fetch(`/api/quotations?${params}`)
      const data = await res.json()

      setQuotations(data.data ?? [])
      setTotalItems(data.total ?? 0)
    } catch (error) {
      console.error('Error fetching quotations:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  // ✅ Cálculos seguros
  const avgWeight = quotations.length
    ? (
      quotations.reduce((acc, curr) => acc + Number(curr.weight_lbs), 0) /
      quotations.length
    ).toFixed(1)
    : '0'

  const totalRevenue = quotations.reduce(
    (acc, curr) => acc + Number(curr.total),
    0
  )

  const pageCount = Math.ceil(totalItems / LIMIT)

  return (
    <DashboardLayout
      pageTitle="Cotizaciones"
      navItems={NAV_ITEMS}
      onReload={fetchQuotations}
    >
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">
              Gestión de Cotizaciones
            </h2>
            <p className="text-gray-500 text-sm">
              Visualiza y gestiona los cálculos de envío
            </p>
          </div>

          <button
            onClick={() => router.push('/admin/cotizaciones/nueva')}
            className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm"
          >
            + Nueva Cotización
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Cotizaciones" value={totalItems} icon="📦" color="bg-blue-500" />
          <StatCard title="Promedio Peso" value={`${avgWeight} lbs`} icon="⚖️" color="bg-purple-500" />
          <StatCard title="Ingresos Estimados" value={`$${totalRevenue.toLocaleString()}`} icon="💰" color="bg-green-600" />
        </div>

        {/* Buscador */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <input
            type="text"
            placeholder="Buscar por ID o Cliente..."
            className="w-full md:w-80 px-4 py-2 border rounded-lg outline-none focus:ring-2 ring-blue-500/20"
            value={search}
            onChange={(e) => {
              setPage(0) // 🔥 reset paginación
              setSearch(e.target.value)
            }}
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs text-gray-400">ID</th>
                  <th className="p-4 text-xs text-gray-400">Destino / Cliente</th>
                  <th className="p-4 text-xs text-gray-400">Detalles</th>
                  <th className="p-4 text-xs text-gray-400">Costo</th>
                  <th className="p-4 text-xs text-gray-400">Total</th>
                  <th className="p-4 text-xs text-gray-400 text-center">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400 animate-pulse">
                      Cargando cotizaciones...
                    </td>
                  </tr>
                ) : quotations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      No hay resultados
                    </td>
                  </tr>
                ) : (
                  quotations.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-mono text-sm font-bold text-blue-600">
                        #{q.id}
                      </td>

                      <td className="p-4">
                        <div className="text-sm font-bold truncate max-w-[220px]">
                          {q.destination_location?.address
                            ?? q.destination_location?.city
                            ?? 'Sin dirección'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Odoo: {q.odoo_customer_id || 'N/A'}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-gray-600">
                        <div><b>Peso:</b> {q.weight_lbs} lbs</div>
                        <div><b>Distancia:</b> {q.calculated_distance_miles} mi</div>
                      </td>

                      <td className="p-4 text-sm text-gray-600">
                        <div>${q.shipping_price}</div>
                        <div className="text-[10px] text-gray-400">
                          + ${q.pickup_price} Pickup
                        </div>
                      </td>

                      <td className="p-4 font-extrabold text-gray-900">
                        ${q.total}
                      </td>

                      <td className="p-4 text-center">
                        <button className="text-gray-400 hover:text-blue-600 p-2">
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="p-4 border-t border-gray-50">
            <Pagination
              page={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-xl text-white`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  )
}