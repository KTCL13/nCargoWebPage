'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'
import { Pagination } from '@/components/ui/Pagination'
import { useShipments } from '@/lib/admin/shipments/useShipments'
import { STAGES, STAGE_STYLE, Envio, Locker } from '@/types/admin/shipments'

function fmtDate(d: string) { return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) }

function stageBadge(name: string | null) {
  const cls = name ? (STAGE_STYLE[name] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-400'
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cls}`}>{name ?? 'Sin etapa'}</span>
}

export default function EnviosPage() {
  const { token } = useAuth()
  const {
    lockers, lockersTotal, lockersPage, setLockersPage, lockersPageSize, setLockersPageSize, lockersLoading,
    syncing, syncTerm, setSyncTerm, handleSync,
    selectedLocker, setSelectedLocker, envios, enviosTotal, enviosPage, setEnviosPage, enviosPageSize, setEnviosPageSize, enviosLoading,
    envioSearch, setEnvioSearch, loadLockers, loadEnvios
  } = useShipments(token)

  const [editId, setEditId] = useState<number | null>(null)
  const [editTracking, setEditTracking] = useState(''); const [editStage, setEditStage] = useState(''); const [editComment, setEditComment] = useState('')
  const [saving, setSaving] = useState(false); const [showNewEnvio, setShowNewEnvio] = useState(false)
  const [newName, setNewName] = useState(''); const [newDesc, setNewDesc] = useState(''); const [creating, setCreating] = useState(false)

  const startEdit = (e: Envio) => { setEditId(e.id); setEditTracking(e.trackingNumber ?? ''); setEditStage(e.odooStageName ?? ''); setEditComment('') }
  const saveEdit = async (e: Envio) => {
    setSaving(true)
    try {
      const res = await fetch('/api/shipments', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: e.id, trackingNumber: editTracking, odooStageName: editStage, comment: editComment.trim() || undefined }) })
      if (res.ok) { setEditId(null); loadEnvios(); loadLockers() }
    } finally { setSaving(false) }
  }

  const handleCreateEnvio = async () => {
    if (!selectedLocker || !newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`/api/lockers/${selectedLocker.id}/shipments`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }) })
      if (res.ok) { setShowNewEnvio(false); setNewName(''); setNewDesc(''); loadEnvios(); loadLockers() }
    } finally { setCreating(false) }
  }

  return (
    <DashboardLayout pageTitle="Gestión de Envíos" navItems={NAV_ITEMS} onReload={loadLockers}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="font-titles text-2xl font-extrabold">Casilleros y Envíos</h2><p className="text-gray-500 text-sm">{lockersTotal} casilleros sincronizados</p></div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="text" value={syncTerm} onChange={e => setSyncTerm(e.target.value)} placeholder="Buscar en Odoo…" className="form-input text-sm w-56" onKeyDown={e => e.key === 'Enter' && !syncing && handleSync()} />
            <button onClick={handleSync} disabled={syncing} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm disabled:opacity-60">{syncing ? 'Sincronizando…' : '🔄 Sincronizar'}</button>
          </div>
        </div>

        <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b"><tr>{['Proyecto / Casillero', 'Cliente', 'Envíos', 'Última sync', ''].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase font-bold">{h}</th>)}</tr></thead>
            <tbody className="divide-y">
              {lockersLoading ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Cargando…</td></tr> : lockers.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-gray-400">Sin datos</td></tr> : lockers.map(l => (
                <tr key={l.id} className={`hover:bg-indigo-50 cursor-pointer ${selectedLocker?.id === l.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`} onClick={() => { setSelectedLocker(l); setEditId(null) }}>
                  <td className="px-4 py-3 font-semibold">{l.odooProjectName}</td><td className="px-4 py-3 text-gray-500 text-xs">{l.customerName ?? '—'}</td><td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${l._count.shipments > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>{l._count.shipments}</span></td><td className="px-4 py-3 text-xs text-gray-400">{l.lastSyncedAt ? fmtDate(l.lastSyncedAt) : '—'}</td><td className="px-4 py-3 text-right text-indigo-500 text-xs font-bold">{selectedLocker?.id === l.id ? 'Seleccionado ›' : 'Ver envíos ›'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-4 border-t"><Pagination page={lockersPage} pageSize={lockersPageSize} totalItems={lockersTotal} onPageChange={setLockersPage} onPageSizeChange={setLockersPageSize} /></div>
        </section>

        {selectedLocker && (
          <section className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="font-bold text-gray-700">Envíos — <span className="text-indigo-600">{selectedLocker.odooProjectName}</span></h3><p className="text-xs text-gray-400">{enviosTotal} total</p></div>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="text" value={envioSearch} onChange={e => setEnvioSearch(e.target.value)} placeholder="Buscar envíos…" className="form-input text-sm w-48" />
                <button onClick={() => setShowNewEnvio(!showNewEnvio)} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm">+ Nuevo</button>
                <button onClick={() => setSelectedLocker(null)} className="text-gray-400 hover:text-gray-700 text-xl">×</button>
              </div>
            </div>

            {showNewEnvio && (
              <div className="px-5 py-4 bg-indigo-50 border-b flex flex-wrap gap-3 items-end">
                <div className="flex-1"><label className="text-xs text-gray-500 font-bold block mb-1">Nombre *</label><input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="form-input text-sm w-full" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500 font-bold block mb-1">Descripción</label><input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)} className="form-input text-sm w-full" /></div>
                <button onClick={handleCreateEnvio} disabled={creating || !newName.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-60">Crear</button>
              </div>
            )}

            <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr>{['#', 'Nombre', 'Etapa', 'Tracking', 'Fecha', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-xs text-gray-400 uppercase font-bold">{h}</th>)}</tr></thead>
              <tbody className="divide-y">
                {enviosLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando…</td></tr> : envios.map(e => editId === e.id ? (
                  <tr key={e.id} className="bg-indigo-50"><td className="px-4 py-3 font-bold text-gray-500">#{e.odooTaskId ?? e.id}</td><td className="px-4 py-3 font-semibold text-gray-700">{e.odooTaskName}</td><td className="px-4 py-3"><select value={editStage} onChange={ev => setEditStage(ev.target.value)} className="form-input text-sm">{STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></td><td className="px-4 py-3"><input type="text" value={editTracking} onChange={ev => setEditTracking(ev.target.value)} placeholder="Tracking" className="form-input text-sm w-32 mb-1" /><input type="text" value={editComment} onChange={ev => setEditComment(ev.target.value)} placeholder="Nota" className="form-input text-sm w-32" /></td><td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.createdAt)}</td><td className="px-4 py-3 flex gap-2"><button onClick={() => saveEdit(e)} disabled={saving} className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-lg font-bold">{saving ? '…' : 'OK'}</button><button onClick={() => setEditId(null)} className="text-xs text-gray-500">X</button></td></tr>
                ) : (
                  <tr key={e.id} className="hover:bg-gray-50 transition"><td className="px-4 py-3 text-gray-400 text-xs">#{e.odooTaskId ?? e.id}</td><td className="px-4 py-3 font-semibold text-gray-800">{e.odooTaskName}</td><td className="px-4 py-3">{stageBadge(e.odooStageName)}</td><td className="px-4 py-3 font-mono text-xs text-blue-600">{e.trackingNumber ?? '—'}</td><td className="px-4 py-3 text-xs text-gray-400">{fmtDate(e.createdAt)}</td><td className="px-4 py-3"><button onClick={() => startEdit(e)} className="text-xs border border-indigo-200 text-indigo-600 px-3 py-1 rounded-lg font-bold">Editar</button></td></tr>
                ))}
              </tbody>
            </table></div>
            <div className="px-5 py-4 border-t"><Pagination page={enviosPage} pageSize={enviosPageSize} totalItems={enviosTotal} onPageChange={setEnviosPage} onPageSizeChange={setEnviosPageSize} /></div>
          </section>
        )}
      </div>
    </DashboardLayout>
  )
}
