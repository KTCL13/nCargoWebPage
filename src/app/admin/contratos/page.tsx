'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useContracts } from '@/lib/admin/contracts/useContracts'

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ContratosPage() {
  const {
    contracts, total, page, setPage, search, setSearch, pageSize, setPageSize, loading,
    dirty, selected, setSelected, saving, historyOpen, setHistoryOpen, historyList, historyLoading, historyEmpName,
    fetchContracts, toggleActive, saveRow, saveAll, openHistory
  } = useContracts()

  const bulkUpdate = async (isActive: boolean) => {
    await Promise.all([...selected].map(id => fetch(`/api/contracts?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })))
    setSelected(new Set()); fetchContracts()
  }

  const toggleSelect = (id: number) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => setSelected(selected.size === contracts.length ? new Set() : new Set(contracts.map(c => c.id)))

  return (
    <DashboardLayout pageTitle="Contratos" navItems={NAV_ITEMS} onReload={fetchContracts}>
      <div className="bg-white rounded-[var(--radius-xl)] shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b">
          <h3 className="font-titles text-lg font-bold">Listado de Contratos</h3>
          <div className="relative"><input type="text" placeholder="Buscar..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} className="form-input pl-8 w-56" /><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span></div>
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-medium text-blue-700">{selected.size} seleccionados</span>
            <button onClick={() => bulkUpdate(true)} className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white font-bold">Activar</button>
            <button onClick={() => bulkUpdate(false)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-500 text-white font-bold">Desactivar</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-gray-50"><th className="px-4 py-3"><input type="checkbox" checked={contracts.length > 0 && selected.size === contracts.length} onChange={toggleSelectAll} /></th>{['Empleado', 'Cargo', 'Tipo', 'Salario', 'Vigente', 'Inicio', 'Fin', 'Acciones'].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-gray-500 uppercase text-[10px]">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={10} className="text-center py-10 text-gray-400">Cargando...</td></tr> : contracts.length === 0 ? <tr><td colSpan={10} className="text-center py-10 text-gray-400">Sin resultados</td></tr> : contracts.map(c => {
                const currentActive = dirty[c.id]?.isActive ?? c.isActive; const isDirty = dirty[c.id] !== undefined; const isSaving = saving.has(c.id)
                return (
                  <tr key={c.id} className="border-b hover:bg-gray-50/50 transition"><td className="px-4 py-3"><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)} /></td><td className="px-4 py-3"><p className="font-bold">{c.employee.name}</p><p className="text-[10px] text-gray-400">{c.employee.email}</p></td><td className="px-4 py-3">{c.job.title}</td><td className="px-4 py-3 text-xs">{c.contractType?.name}</td><td className="px-4 py-3 text-xs">{c.salary ? `$${c.salary}` : (c.hourlyRate ? `$${c.hourlyRate}/h` : '—')}</td><td className="px-4 py-3"><button onClick={() => toggleActive(c.id, c.isActive)} className={`w-8 h-4 rounded-full relative transition ${currentActive ? 'bg-green-500' : 'bg-gray-200'}`}><span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition ${currentActive ? 'left-4.5' : 'left-0.5'}`} /></button></td><td className="px-4 py-3 text-xs">{fmt(c.startDate)}</td><td className="px-4 py-3 text-xs">{fmt(c.endDate)}</td><td className="px-4 py-3 flex gap-2"><button onClick={() => saveRow(c.id)} disabled={!isDirty || isSaving} className={`text-xs px-3 py-1 rounded-lg font-bold ${isDirty && !isSaving ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>{isSaving ? '...' : 'OK'}</button><button onClick={() => openHistory(c.employee.id, c.employee.name)} className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-bold">Log</button></td></tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t"><Pagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={setPageSize} /></div>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col p-6"><div className="flex justify-between items-center mb-4"><div><h2 className="font-bold text-lg">Historial: {historyEmpName}</h2></div><button onClick={() => setHistoryOpen(false)} className="text-gray-400 text-xl">×</button></div><div className="overflow-y-auto space-y-3">{historyLoading ? <p>Cargando...</p> : historyList.map(hc => (<div key={hc.id} className="border p-3 rounded-lg"><div className="flex justify-between font-bold text-sm"><span>{hc.job.title}</span><span className={hc.isActive ? 'text-green-600' : 'text-gray-400'}>{hc.isActive ? 'Activo' : 'Cerrado'}</span></div><div className="grid grid-cols-2 text-xs text-gray-500 mt-1"><span>{hc.contractType.name}</span><span>{fmt(hc.startDate)} - {fmt(hc.endDate)}</span></div></div>))}</div></div>
        </div>
      )}
    </DashboardLayout>
  )
}