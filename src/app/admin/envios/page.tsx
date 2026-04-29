'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'

const LIMIT = 10

type Shipment = {
  id: number
  quotation_id?: number
  provider_id: number
  status_id: number
  odoo_order_id?: number
  odoo_customer_id?: number
  tracking_number?: string
  weight_lbs: number
  received_at_mailbox?: string
  delivered_at?: string
  created_at: string
  status?: { name: string; color: string }
  provider?: { name: string }
}

export default function EnviosPage() {
  // ── State ─────────────────────────────────────────────
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Debounce búsqueda ─────────────────────────────────
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0) // 🔥 reset página al buscar
    }, 400)

    return () => clearTimeout(timeout)
  }, [search])

  // ── Fetch Shipments ──────────────────────────────────
  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
        ...(debouncedSearch && { search: debouncedSearch }),
      })

      const res = await fetch(`/api/shipments?${params}`)
      const data = await res.json()

      setShipments(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error('Error cargando envíos:', err)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    fetchShipments()
  }, [fetchShipments])

  // ── Helpers ───────────────────────────────────────────
  const formatDate = (dateStr?: string) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      })
      : '—'

  const totalWeight = shipments.reduce((acc, s) => acc + Number(s.weight_lbs), 0)

  // ── UI ───────────────────────────────────────────────
  return (
    <DashboardLayout
      pageTitle="Gestión de Envíos"
      navItems={NAV_ITEMS}
      onReload={fetchShipments}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-titles text-2xl font-extrabold">
              Envíos y Logística
            </h2>
            <p className="text-gray-500 text-sm">
              Seguimiento de órdenes y estados de entrega
            </p>
          </div>

          <button className="bg-[var(--color-primary)] text-white px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition">
            + Registrar Envío
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            title="Total Envíos"
            value={total}
            icon="📦"
            bg="bg-blue-500"
            dark
          />

          <Card
            title="Peso Total (lbs)"
            value={totalWeight.toFixed(1)}
            icon="🚚"
            bg="bg-green-500"
          />

          <Card
            title="En Tránsito"
            value={shipments.length}
            icon="📍"
            bg="bg-orange-500"
          />
        </div>

        {/* Buscador */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <input
            type="text"
            placeholder="Buscar por Tracking u Orden Odoo..."
            className="w-full md:w-96 px-4 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 ring-blue-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-xs text-gray-400 uppercase">
                    ID / Tracking
                  </th>
                  <th className="p-4 text-xs text-gray-400 uppercase">
                    Cliente / Odoo
                  </th>
                  <th className="p-4 text-xs text-gray-400 uppercase">
                    Peso
                  </th>
                  <th className="p-4 text-xs text-gray-400 uppercase">
                    Línea de Tiempo
                  </th>
                  <th className="p-4 text-xs text-gray-400 uppercase">
                    Estado
                  </th>
                  <th className="p-4 text-xs text-gray-400 uppercase text-center">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      Cargando datos...
                    </td>
                  </tr>
                ) : shipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      No hay resultados
                    </td>
                  </tr>
                ) : (
                  shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-bold">#{s.id}</div>
                        <div className="text-xs text-blue-600 font-mono">
                          {s.tracking_number || 'SIN TRACKING'}
                        </div>
                      </td>

                      <td className="p-4 text-sm">
                        <div>ID Cliente: {s.odoo_customer_id || '—'}</div>
                        <div className="text-[10px] text-gray-400 uppercase">
                          Orden: {s.odoo_order_id || '—'}
                        </div>
                      </td>

                      <td className="p-4 font-bold">{s.weight_lbs} lbs</td>

                      <td className="p-4 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Recibido:</span>
                          <span>{formatDate(s.received_at_mailbox)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Entregado:</span>
                          <span>{formatDate(s.delivered_at)}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor:
                              s.status?.color || '#e5e7eb',
                            color: '#111',
                          }}
                        >
                          {s.status?.name || `Estado ${s.status_id}`}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <button className="text-gray-400 hover:text-blue-600">
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
          <div className="p-4 border-t">
            <Pagination
              page={page}
              pageCount={Math.ceil(total / LIMIT)}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

// ── Componente reutilizable KPI ─────────────────────────
function Card({
  title,
  value,
  icon,
  bg,
  dark,
}: {
  title: string
  value: number | string
  icon: string
  bg: string
  dark?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-4 px-6 py-5 rounded-xl ${dark ? 'bg-[var(--color-foreground)] text-white' : 'bg-white border shadow-sm'
        }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-xl ${bg}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-xs opacity-60 uppercase font-bold">{title}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  )
}