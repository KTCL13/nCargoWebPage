'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'

const DEFAULT_LIMIT = 10

type Shipment = {
  id: number
  odooTaskId?: number
  odooTaskName?: string
  odooProjectName?: string
  odooCustomerName?: string
  odooStageName?: string
  trackingNumber?: string
  createdAt: string
  status?: { name: string }
}

export default function EmployeeEnviosPage() {
  const { token } = useAuth()
  const authToken = token ?? ''

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Per-row tracking edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [rowFeedback, setRowFeedback] = useState<{ id: number; msg: string; ok: boolean } | null>(null)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [search])

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        isLocker: 'true',
      })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await fetch(`/api/shipments?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const json = await res.json()
      setShipments(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, authToken])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  function startEdit(s: Shipment) {
    setEditingId(s.id)
    setEditValue(s.trackingNumber ?? '')
    setRowFeedback(null)
  }

  async function saveTracking(s: Shipment) {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: s.id, trackingNumber: editValue.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Error')
      setRowFeedback({ id: s.id, msg: 'Guardado', ok: true })
      setEditingId(null)
      fetchShipments()
    } catch (err) {
      setRowFeedback({ id: s.id, msg: (err as Error).message, ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setRowFeedback(null), 3000)
    }
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <DashboardLayout pageTitle="Mis Envíos" navItems={NAV_ITEMS} onReload={fetchShipments}>
      <div className="space-y-6">
        <div>
          <h2 className="font-titles text-2xl font-extrabold">Envíos de Casilleros</h2>
          <p className="text-gray-500 text-sm">{total} envío{total !== 1 ? 's' : ''} registrados</p>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border shadow-sm">
          <input
            type="text"
            placeholder="Buscar por tracking, cliente o proyecto..."
            className="w-full md:w-96 px-4 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 ring-blue-500/20"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['#ID', 'Paquete', 'Cliente', 'Etapa', 'Tracking Number', 'Estado', 'Fecha', 'Acción'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan={8} className="p-10 text-center text-gray-400">Cargando...</td></tr>
                ) : shipments.length === 0 ? (
                  <tr><td colSpan={8} className="p-10 text-center text-gray-400">No hay envíos de casilleros</td></tr>
                ) : shipments.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-bold text-gray-700">#{s.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 max-w-[160px] truncate" title={s.odooTaskName ?? ''}>
                      {s.odooTaskName ?? `Envío #${s.id}`}
                    </td>
                    <td className="px-4 py-3 text-xs">{s.odooCustomerName ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{s.odooStageName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {editingId === s.id ? (
                        <input
                          autoFocus
                          className="w-40 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ring-indigo-400"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveTracking(s); if (e.key === 'Escape') setEditingId(null) }}
                        />
                      ) : (
                        <span className="font-mono text-xs text-blue-600">
                          {s.trackingNumber || <span className="text-gray-300">Sin tracking</span>}
                        </span>
                      )}
                      {rowFeedback?.id === s.id && (
                        <span className={`ml-2 text-xs font-bold ${rowFeedback.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {rowFeedback.msg}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                        {s.status?.name ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      {editingId === s.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveTracking(s)}
                            disabled={saving}
                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-800">
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(s)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold border border-indigo-200 px-2 py-1 rounded-lg hover:bg-indigo-50 transition"
                        >
                          + Tracking
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
