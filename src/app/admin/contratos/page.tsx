'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'

const DEFAULT_LIMIT = 10

type Contract = {
  id: number
  salary: number | null
  hourlyRate: number | null
  startDate: string
  endDate: string | null
  isActive: boolean
  employee: { id: number; name: string; email: string }
  job: { id: number; title: string }
  contractType: { id: number; name: string }
}

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ContratosPage() {
  const router = useRouter()

  const [contracts, setContracts] = useState<Contract[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const [dirty, setDirty] = useState<Record<number, { isActive: boolean }>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState<Set<number>>(new Set())

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState<Contract[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyEmpName, setHistoryEmpName] = useState('')

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setDirty({})
    setSelected(new Set())
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
      })
      const res = await fetch(`/api/contracts?${params}`)

      // VALIDACIÓN CRUCIAL:
      if (!res.ok) {
        const errorText = await res.text(); // Captura el error para debug
        throw new Error(`Error ${res.status}: ${errorText}`);
      }

      const data = await res.json()
      setContracts(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (error) {
      console.error("Error cargando contratos:", error)
      // Opcional: mostrar una alerta al usuario
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])


  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // ── Inline Edit ───────────────────────────────────────────────────────
  function toggleActive(id: number, current: boolean) {
    setDirty(d => ({
      ...d,
      [id]: { ...(d[id] ?? {}), isActive: !(d[id]?.isActive ?? current) },
    }))
  }

  // ── History Modal ─────────────────────────────────────────────────────
  async function openHistory(empId: number, empName: string) {
    setHistoryOpen(true)
    setHistoryEmpName(empName)
    setHistoryLoading(true)
    setHistoryList([])
    try {
      const res = await fetch(`/api/employees/contracts?employeeId=${empId}`)
      const data = await res.json()
      setHistoryList(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      alert('Error cargando historial')
    } finally {
      setHistoryLoading(false)
    }
  }

  // ── Save row ──────────────────────────────────────────────────────────
  async function saveRow(id: number) {
    const changes = dirty[id]
    if (!changes) return
    setSaving(s => new Set(s).add(id))
    try {
      await fetch(`/api/contracts?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      })
      setDirty(d => { const n = { ...d }; delete n[id]; return n })
      setContracts(list =>
        list.map(c => c.id === id ? { ...c, ...changes } : c)
      )
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  async function saveAll() {
    await Promise.all(Object.keys(dirty).map(id => saveRow(Number(id))))
  }

  // ── Bulk ──────────────────────────────────────────────────────────────
  async function bulkUpdate(isActive: boolean) {
    await Promise.all(
      [...selected].map(id =>
        fetch(`/api/contracts?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        })
      )
    )
    setSelected(new Set())
    fetchContracts()
  }

  function toggleSelect(id: number) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleSelectAll() {
    setSelected(selected.size === contracts.length ? new Set() : new Set(contracts.map(c => c.id)))
  }

  const hasDirty = Object.keys(dirty).length > 0

  return (
    <DashboardLayout
      pageTitle="Contratos"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h3 className="font-titles text-lg font-bold text-[var(--color-foreground)]">
            Listado de Contratos
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por empleado o cargo..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              className="form-input pl-8 w-56"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-subtitles text-blue-700 font-medium">
              {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => bulkUpdate(true)}
              className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              Activar
            </button>
            <button
              onClick={() => bulkUpdate(false)}
              className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-gray-500 text-white font-semibold hover:bg-gray-600 transition"
            >
              Desactivar
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={contracts.length > 0 && selected.size === contracts.length}
                    onChange={toggleSelectAll}
                    className="accent-[var(--color-primary)] w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Empleado</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Cargo</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Salario</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Tarifa/h</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Vigente</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Inicio</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Fin</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 font-subtitles text-sm">Cargando...</td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 font-subtitles text-sm">No se encontraron contratos</td>
                </tr>
              ) : contracts.map(c => {
                const currentActive = dirty[c.id]?.isActive ?? c.isActive
                const isDirty = dirty[c.id] !== undefined
                const isSaving = saving.has(c.id)

                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="accent-[var(--color-primary)] w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-subtitles font-semibold text-[var(--color-foreground)]">{c.employee.name}</p>
                      <p className="text-xs text-gray-400">{c.employee.email}</p>
                    </td>
                    <td className="px-4 py-3 font-subtitles text-gray-700">{c.job.title}</td>
                    <td className="px-4 py-3 font-subtitles text-gray-600 text-xs">
                      {c.contractType?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-subtitles text-gray-700 text-xs whitespace-nowrap">
                      {c.salary != null ? `$${c.salary}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-subtitles text-gray-700 text-xs whitespace-nowrap">
                      {c.hourlyRate != null ? `$${c.hourlyRate}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        role="switch"
                        aria-checked={currentActive}
                        onClick={() => toggleActive(c.id, c.isActive)}
                        className="switch-btn"
                        aria-label="Cambiar estado del contrato"
                      >
                        <span className="switch-thumb" />
                      </button>
                    </td>
                    <td className="px-4 py-3 font-subtitles text-gray-600 text-xs whitespace-nowrap">{fmt(c.startDate)}</td>
                    <td className="px-4 py-3 font-subtitles text-gray-600 text-xs whitespace-nowrap">{fmt(c.endDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveRow(c.id)}
                          disabled={!isDirty || isSaving}
                          className={`
                            text-xs px-3 py-1.5 rounded-[var(--radius-lg)] font-semibold font-subtitles transition
                            ${isDirty && !isSaving
                              ? 'bg-[var(--color-foreground)] text-white hover:opacity-80'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }
                          `}
                        >
                          {isSaving ? '...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => openHistory(c.employee.id, c.employee.name)}
                          className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-blue-50 text-blue-600 font-semibold font-subtitles transition hover:bg-blue-100"
                        >
                          Historial
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-4">
          {hasDirty && (
            <div className="flex justify-start">
              <button
                onClick={saveAll}
                className="text-sm px-4 py-2 rounded-[var(--radius-lg)] font-semibold font-subtitles bg-[var(--color-foreground)] text-white hover:opacity-80 transition shadow-sm"
              >
                Guardar todo ({Object.keys(dirty).length})
              </button>
            </div>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">
                  Historial de Contratos
                </h2>
                <p className="font-subtitles text-sm text-gray-500 mt-0.5">
                  Empleado: {historyEmpName}
                </p>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-6 flex-1">
              {historyLoading ? (
                <div className="text-center py-10 text-gray-400 font-subtitles">Cargando historial...</div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-subtitles">No hay historial disponible</div>
              ) : (
                <div className="space-y-4">
                  {historyList.map(hc => (
                    <div key={hc.id} className="border border-gray-100 rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-titles font-semibold text-[var(--color-foreground)]">{hc.job.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${hc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {hc.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div><span className="text-gray-400 block text-xs">Tipo</span>{hc.contractType.name}</div>
                        <div><span className="text-gray-400 block text-xs">Salario</span>{hc.salary != null ? `$${hc.salary}` : '—'}</div>
                        <div><span className="text-gray-400 block text-xs">Inicio</span>{fmt(hc.startDate)}</div>
                        <div><span className="text-gray-400 block text-xs">Fin</span>{fmt(hc.endDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}