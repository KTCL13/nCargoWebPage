'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

// ── Types ─────────────────────────────────────────────────────────────────────

type Locker = {
  id: number
  odooProjectId: number
  odooProjectName: string
  customerName: string | null
  lastSyncedAt: string | null
  _count: { shipments: number }
}

type Envio = {
  id: number
  odooTaskId: number | null
  odooTaskName: string | null
  odooProjectName: string | null
  odooCustomerName: string | null
  odooStageName: string | null
  trackingNumber: string | null
  createdAt: string
}

const STAGES = ['Pendiente', 'En proceso', 'Entregado', 'Cancelado'] as const
type Stage = typeof STAGES[number]

const STAGE_STYLE: Record<string, string> = {
  'Pendiente':  'bg-amber-100 text-amber-800',
  'En proceso': 'bg-blue-100 text-blue-800',
  'Entregado':  'bg-green-100 text-green-800',
  'Cancelado':  'bg-red-100 text-red-600',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
}

function stageBadge(name: string | null) {
  const cls = name ? (STAGE_STYLE[name] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-400'
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cls}`}>
      {name ?? 'Sin etapa'}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function EnviosPage() {
  const { token } = useAuth()
  const authToken = token ?? ''
  const headers = { Authorization: `Bearer ${authToken}` }

  // Lockers state
  const [lockers, setLockers] = useState<Locker[]>([])
  const [lockersLoading, setLockersLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncTerm, setSyncTerm] = useState('')

  // Selected locker + its envíos
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [envios, setEnvios] = useState<Envio[]>([])
  const [enviosLoading, setEnviosLoading] = useState(false)
  const [envioSearch, setEnvioSearch] = useState('')
  const [debouncedEnvioSearch, setDebouncedEnvioSearch] = useState('')

  // Edit envío inline
  const [editId, setEditId] = useState<number | null>(null)
  const [editTracking, setEditTracking] = useState('')
  const [editStage, setEditStage] = useState('')
  const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false)

  // New envío modal
  const [showNewEnvio, setShowNewEnvio] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounce envío search ─────────────────────────────────────────────────
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setDebouncedEnvioSearch(envioSearch), 350)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [envioSearch])

  // ── Load lockers ─────────────────────────────────────────────────────────
  const loadLockers = useCallback(async () => {
    setLockersLoading(true)
    try {
      const res = await fetch('/api/lockers', { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      setLockers(json.data ?? json)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setLockersLoading(false)
    }
  }, [authToken]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadLockers() }, [loadLockers])

  // ── Load envíos when locker selected or search changes ───────────────────
  const loadEnvios = useCallback(async () => {
    if (!selectedLocker) return
    setEnviosLoading(true)
    try {
      const params = new URLSearchParams()
      if (debouncedEnvioSearch) params.set('search', debouncedEnvioSearch)
      const res = await fetch(`/api/lockers/${selectedLocker.id}/shipments?${params}`, { headers })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      setEnvios(json.data ?? json)
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setEnviosLoading(false)
    }
  }, [selectedLocker, debouncedEnvioSearch, authToken]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadEnvios() }, [loadEnvios])

  // ── Sync ─────────────────────────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch('/api/odoo/sync-lockers', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: syncTerm.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      showToast(
        `${json.lockers} casillero${json.lockers !== 1 ? 's' : ''} · ${json.shipments} envío${json.shipments !== 1 ? 's' : ''} sincronizados`,
        true,
      )
      loadLockers()
      if (selectedLocker) loadEnvios()
    } catch (e) {
      showToast((e as Error).message, false)
    } finally {
      setSyncing(false)
    }
  }

  // ── Select locker ─────────────────────────────────────────────────────────
  function selectLocker(locker: Locker) {
    setSelectedLocker(locker)
    setEnvioSearch('')
    setDebouncedEnvioSearch('')
    setEditId(null)
    setShowNewEnvio(false)
  }

  // ── Edit envío ────────────────────────────────────────────────────────────
  function startEdit(e: Envio) {
    setEditId(e.id)
    setEditTracking(e.trackingNumber ?? '')
    setEditStage(e.odooStageName ?? '')
    setEditComment('')
  }

  function cancelEdit() { setEditId(null) }

  async function saveEdit(e: Envio) {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { id: e.id }
      if (editTracking !== (e.trackingNumber ?? '')) body.trackingNumber = editTracking
      if (editStage !== (e.odooStageName ?? ''))      body.odooStageName = editStage
      if (editComment.trim())                          body.comment = editComment.trim()

      const res = await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      showToast('Envío actualizado', true)
      cancelEdit()
      loadEnvios()
      loadLockers()
    } catch (err) {
      showToast((err as Error).message, false)
    } finally {
      setSaving(false)
    }
  }

  // ── Create new envío ─────────────────────────────────────────────────────
  async function handleCreateEnvio() {
    if (!selectedLocker || !newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/lockers/${selectedLocker.id}/shipments`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message)
      showToast('Envío creado en Odoo', true)
      setShowNewEnvio(false)
      setNewName('')
      setNewDesc('')
      loadEnvios()
      loadLockers()
    } catch (err) {
      showToast((err as Error).message, false)
    } finally {
      setCreating(false)
    }
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout pageTitle="Gestión de Envíos" navItems={NAV_ITEMS} onReload={loadLockers}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-bold
          ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-titles text-2xl font-extrabold">Casilleros y Envíos</h2>
            <p className="text-gray-500 text-sm">
              {lockers.length} casillero{lockers.length !== 1 ? 's' : ''} sincronizados
            </p>
          </div>

          {/* Sync controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={syncTerm}
              onChange={e => setSyncTerm(e.target.value)}
              placeholder="Buscar casilleros en Odoo…"
              className="px-3 py-2 border rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 ring-indigo-400 w-56"
              onKeyDown={e => { if (e.key === 'Enter' && !syncing) handleSync() }}
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {syncing
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : '🔄'}
              {syncing ? 'Sincronizando…' : 'Sincronizar Odoo'}
            </button>
          </div>
        </div>

        {/* ── Casilleros table ── */}
        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h3 className="font-bold text-gray-700">Casilleros</h3>
            <span className="text-xs text-gray-400">{lockers.length} total</span>
          </div>

          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Proyecto / Casillero', 'Cliente', 'Envíos', 'Última sync', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {lockersLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando casilleros…</td></tr>
              ) : lockers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    No hay casilleros — haz clic en <strong>Sincronizar Odoo</strong>
                  </td>
                </tr>
              ) : lockers.map(l => (
                <tr
                  key={l.id}
                  className={`hover:bg-indigo-50 transition cursor-pointer ${selectedLocker?.id === l.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                  onClick={() => selectLocker(l)}
                >
                  <td className="px-4 py-3 font-semibold">{l.odooProjectName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{l.customerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold
                      ${l._count.shipments > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                      {l._count.shipments} envío{l._count.shipments !== 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {l.lastSyncedAt ? fmtDate(l.lastSyncedAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-indigo-500 text-xs font-bold">
                    {selectedLocker?.id === l.id ? 'Seleccionado ›' : 'Ver envíos ›'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Envíos panel (visible when a locker is selected) ── */}
        {selectedLocker && (
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden">

            {/* Panel header */}
            <div className="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-700">
                  Envíos — <span className="text-indigo-600">{selectedLocker.odooProjectName}</span>
                </h3>
                <p className="text-xs text-gray-400">{envios.length} envío{envios.length !== 1 ? 's' : ''}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Envío search */}
                <input
                  type="text"
                  value={envioSearch}
                  onChange={e => setEnvioSearch(e.target.value)}
                  placeholder="Buscar envíos…"
                  className="px-3 py-1.5 border rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-2 ring-indigo-400 w-48"
                />

                {/* New envío */}
                <button
                  onClick={() => setShowNewEnvio(v => !v)}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition"
                >
                  + Nuevo envío
                </button>

                {/* Close panel */}
                <button
                  onClick={() => setSelectedLocker(null)}
                  className="text-gray-400 hover:text-gray-700 text-lg leading-none px-1"
                  title="Cerrar"
                >
                  ×
                </button>
              </div>
            </div>

            {/* New envío form */}
            {showNewEnvio && (
              <div className="px-5 py-4 bg-indigo-50 border-b flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-gray-500 font-bold block mb-1">Nombre del paquete *</label>
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ej: PAQUETE AMAZON"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ring-indigo-400"
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateEnvio() }}
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="text-xs text-gray-500 font-bold block mb-1">Descripción (opcional)</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Detalles del paquete…"
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ring-indigo-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateEnvio}
                    disabled={creating || !newName.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {creating ? 'Creando…' : 'Crear en Odoo'}
                  </button>
                  <button
                    onClick={() => { setShowNewEnvio(false); setNewName(''); setNewDesc('') }}
                    className="text-gray-500 text-sm px-3 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Envíos table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['#', 'Nombre del paquete', 'Etapa', 'Tracking', 'Fecha', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {enviosLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando envíos…</td></tr>
                  ) : envios.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Sin envíos en este casillero</td></tr>
                  ) : envios.map(e => (
                    editId === e.id ? (
                      /* ── Edit row ── */
                      <tr key={e.id} className="bg-indigo-50">
                        <td className="px-4 py-3 font-bold text-gray-500">#{e.odooTaskId ?? e.id}</td>

                        <td className="px-4 py-3 font-semibold max-w-[160px] truncate text-gray-700">
                          {e.odooTaskName ?? `#${e.id}`}
                        </td>

                        {/* Stage dropdown */}
                        <td className="px-4 py-3">
                          <select
                            value={editStage}
                            onChange={ev => setEditStage(ev.target.value)}
                            className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ring-indigo-400"
                          >
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>

                        {/* Tracking + Comment */}
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editTracking}
                            onChange={ev => setEditTracking(ev.target.value)}
                            placeholder="Tracking #"
                            className="w-32 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ring-indigo-400 mb-1 block"
                          />
                          <input
                            type="text"
                            value={editComment}
                            onChange={ev => setEditComment(ev.target.value)}
                            placeholder="Comentario → Odoo"
                            className="w-32 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 ring-amber-300 block"
                          />
                        </td>

                        {/* Date placeholder */}
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.createdAt)}</td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                          <button
                            onClick={() => saveEdit(e)}
                            disabled={saving}
                            className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {saving ? '…' : 'Guardar'}
                          </button>
                          <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-800">
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ) : (
                      /* ── Normal row ── */
                      <tr key={e.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-400 text-xs">#{e.odooTaskId ?? e.id}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px] truncate" title={e.odooTaskName ?? ''}>
                          {e.odooTaskName ?? `Envío #${e.id}`}
                        </td>
                        <td className="px-4 py-3">{stageBadge(e.odooStageName)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600">
                          {e.trackingNumber ?? <span className="text-gray-300 not-italic">Sin tracking</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => startEdit(e)}
                            className="text-xs border border-indigo-200 text-indigo-600 px-3 py-1 rounded-lg hover:bg-indigo-50 font-bold transition"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>
    </DashboardLayout>
  )
}
