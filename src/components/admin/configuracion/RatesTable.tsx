import { useState, useMemo } from 'react'
import { Rate, Location } from '@/types/admin/config'
import { CityCombobox } from './CityCombobox'

const TABLE_PAGE_SIZE = 20

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const left  = Math.max(1, current - 1)
  const right = Math.min(total - 2, current + 1)
  const items: (number | '...')[] = [0]
  if (left > 1) items.push('...')
  for (let i = left; i <= right; i++) items.push(i)
  if (right < total - 2) items.push('...')
  items.push(total - 1)
  return items
}

type RowEdit = { price?: string; city?: string; region?: string }

export function RatesTable({
  rates,
  locations,
  newRate,
  onNewRateChange,
  onSaveRate,
  onSaveLocation,
  onDeleteRate,
  onAddRate,
  addSaving,
}: {
  rates: Rate[]
  locations: Location[]
  newRate: { destId: string; price: string }
  onNewRateChange: (r: { destId: string; price: string }) => void
  onSaveRate: (id: number, price: number) => Promise<void>
  onSaveLocation: (locationId: number, name: string) => Promise<void>
  onDeleteRate: (id: number) => void
  onAddRate: () => void
  addSaving: boolean
}) {
  const [sortField, setSortField] = useState<'city' | 'region' | 'price'>('city')
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc')
  const [page,      setPage]      = useState(0)
  const [search,    setSearch]    = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [editing,   setEditing]   = useState<Record<number, RowEdit>>({})
  const [saved,     setSaved]     = useState<Set<number>>(new Set())
  const [savingRow, setSavingRow] = useState<number | null>(null)

  const departments = useMemo(
    () => [...new Set(rates.map(r => r.destination.region).filter(Boolean))].sort() as string[],
    [rates],
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const result = rates.filter(r => {
      const matchSearch = !q
        || r.destination.city.toLowerCase().includes(q)
        || (r.destination.region ?? '').toLowerCase().includes(q)
      const matchDept = !deptFilter || r.destination.region === deptFilter
      return matchSearch && matchDept
    })
    return [...result].sort((a, b) => {
      let va: string | number
      let vb: string | number
      if (sortField === 'city')   { va = a.destination.city;              vb = b.destination.city }
      else if (sortField === 'region') { va = a.destination.region ?? ''; vb = b.destination.region ?? '' }
      else                        { va = Number(a.basePrice);             vb = Number(b.basePrice) }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [rates, search, deptFilter, sortField, sortDir])

  const pageCount = Math.ceil(filtered.length / TABLE_PAGE_SIZE)
  const pageItems = filtered.slice(page * TABLE_PAGE_SIZE, (page + 1) * TABLE_PAGE_SIZE)
  const dirtyCount = Object.keys(editing).length
  const showStart  = filtered.length === 0 ? 0 : page * TABLE_PAGE_SIZE + 1
  const showEnd    = Math.min((page + 1) * TABLE_PAGE_SIZE, filtered.length)

  function toggleSort(field: 'city' | 'region' | 'price') {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
    setPage(0)
  }

  async function handleSave(rateId: number) {
    const edit = editing[rateId]
    if (!edit) return
    const rate = rates.find(r => r.id === rateId)
    if (!rate) return
    setSavingRow(rateId)
    try {
      const saves: Promise<void>[] = []
      if (edit.price !== undefined) {
        const price = Number(edit.price)
        if (!isNaN(price)) saves.push(onSaveRate(rateId, price))
      }
      if (edit.city !== undefined && edit.city.trim()) {
        saves.push(onSaveLocation(rate.destination.id, edit.city.trim()))
      }
      if (edit.region !== undefined && edit.region.trim() && rate.destination.regionId != null) {
        saves.push(onSaveLocation(rate.destination.regionId, edit.region.trim()))
      }
      await Promise.all(saves)
      setEditing(prev => { const next = { ...prev }; delete next[rateId]; return next })
      setSaved(prev => new Set(prev).add(rateId))
      setTimeout(() => setSaved(prev => { const next = new Set(prev); next.delete(rateId); return next }), 2000)
    } finally {
      setSavingRow(null)
    }
  }

  function handleDiscard(rateId: number) {
    setEditing(prev => { const next = { ...prev }; delete next[rateId]; return next })
  }

  const thCls = 'px-3 py-2.5 text-left text-[11px] font-bold text-[#8b949e] uppercase tracking-wider cursor-pointer select-none hover:text-[#c9d1d9] transition-colors whitespace-nowrap'
  const arrow  = (f: string) => sortField === f ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ↕'
  const pageBtnCls = 'px-2 py-1 text-xs rounded bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9] disabled:opacity-30 disabled:pointer-events-none transition-colors'
  const numInputCls = 'w-20 px-2 py-1 text-sm font-mono rounded bg-[#0d1117] border border-[#30363d] text-[#3fb950] outline-none focus:border-[#1f6feb] transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
  const txtInputCls = 'w-full px-2 py-1 text-sm rounded bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] outline-none focus:border-[#1f6feb] transition-colors'

  return (
    <div className="rounded-xl border border-[#30363d] bg-[#0d1117] overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#30363d] bg-[#161b22]">
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e] text-base pointer-events-none">⌕</span>
          <input
            type="text"
            placeholder="Buscar ciudad o departamento..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-8 pr-7 py-1.5 text-sm rounded-md bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] placeholder-[#484f58] outline-none focus:border-[#1f6feb] transition-colors"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9] text-base leading-none">×</button>}
        </div>
        {departments.length > 0 && (
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(0) }} className="py-1.5 px-3 text-sm rounded-md bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] outline-none focus:border-[#1f6feb] transition-colors">
            <option value="">Todos los departamentos</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        <span className="text-xs text-[#8b949e] whitespace-nowrap">
          {filtered.length === 0 ? 'Sin resultados' : `${showStart}–${showEnd} de ${filtered.length.toLocaleString('es-CO')}`}
        </span>
        <span className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${dirtyCount > 0 ? 'bg-[#b08800]/20 text-[#e3b341] border border-[#b08800]/40' : 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40'}`}>
          {dirtyCount > 0 ? `${dirtyCount} sin guardar` : 'Todo guardado'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table role="grid" aria-label="Data table" className="w-full border-collapse text-sm">
          <thead role="rowgroup">
            <tr role="row" className="border-b border-[#30363d] bg-[#161b22]">
              <th role="columnheader" className="w-10 px-3 py-2.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider text-center">#</th>
              <th role="columnheader" className={thCls} onClick={() => toggleSort('city')}>Ciudad{arrow('city')}</th>
              <th role="columnheader" className={thCls} onClick={() => toggleSort('region')}>Departamento{arrow('region')}</th>
              <th role="columnheader" className={thCls} onClick={() => toggleSort('price')}>Precio USD{arrow('price')}</th>
              <th role="columnheader" className="px-3 py-2.5 text-[11px] font-bold text-[#8b949e] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y divide-[#21262d]">
            {pageItems.length === 0 && <tr role="row"><td role="gridcell" colSpan={5} className="px-4 py-10 text-center text-[#484f58] text-sm">Sin resultados</td></tr>}
            {pageItems.map((rate, idx) => {
              const isDirty  = rate.id in editing
              const isSaved  = saved.has(rate.id)
              const isSaving = savingRow === rate.id
              return (
                <tr role="row" key={rate.id} className={`transition-colors ${isDirty  ? 'bg-[#1c2128] border-l-2 border-l-[#e3b341]' : isSaved ? 'bg-[#0f2a1a] border-l-2 border-l-[#3fb950]' : idx % 2 === 0 ? 'bg-[#0d1117] hover:bg-[#161b22]' : 'bg-[#0a0e14] hover:bg-[#161b22]'}`}>
                  <td role="gridcell" className="px-3 py-2 text-center text-[11px] text-[#484f58] tabular-nums">{page * TABLE_PAGE_SIZE + idx + 1}</td>
                  <td role="gridcell" className="px-3 py-2">
                    <input type="text" value={editing[rate.id]?.city ?? rate.destination.city} onChange={e => setEditing(prev => ({ ...prev, [rate.id]: { ...prev[rate.id], city: e.target.value } }))} className={`${txtInputCls} font-semibold`} />
                  </td>
                  <td role="gridcell" className="px-3 py-2">
                    <input type="text" value={editing[rate.id]?.region ?? (rate.destination.region ?? '')} onChange={e => setEditing(prev => ({ ...prev, [rate.id]: { ...prev[rate.id], region: e.target.value } }))} placeholder="—" className={txtInputCls} />
                  </td>
                  <td role="gridcell" className="px-3 py-2">
                    <div className="flex items-center gap-1"><span className="text-[#3fb950] font-mono text-xs font-bold shrink-0">$</span><input type="number" step="0.5" min="0" value={editing[rate.id]?.price ?? String(rate.basePrice)} onChange={e => setEditing(prev => ({ ...prev, [rate.id]: { ...prev[rate.id], price: e.target.value } }))} className={numInputCls} /></div>
                  </td>
                  <td role="gridcell" className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1.5">{isSaved && !isDirty ? <span className="text-xs text-[#3fb950] font-semibold">✓ Guardado</span> : isDirty ? <><button onClick={() => handleSave(rate.id)} disabled={isSaving} className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-50 transition-colors">{isSaving ? '...' : 'Guardar'}</button><button onClick={() => handleDiscard(rate.id)} disabled={isSaving} className="px-2 py-1 text-xs rounded bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] disabled:opacity-50 transition-colors">✕</button></> : <><span className="text-[#484f58] text-xs select-none">—</span><button onClick={() => onDeleteRate(rate.id)} title="Eliminar tarifa" className="w-6 h-6 flex items-center justify-center text-xs rounded text-[#6e7681] hover:text-[#f85149] hover:bg-[#21262d] transition-colors">✕</button></>}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-[#30363d] bg-[#161b22]">
          <span className="text-xs text-[#8b949e]">Página {page + 1} de {pageCount}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className={pageBtnCls}>«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className={pageBtnCls}>‹</button>
            {buildPageRange(page, pageCount).map((p, i) => p === '...' ? <span key={`el-${i}`} className="px-1 text-xs text-[#484f58]">…</span> : <button key={p} onClick={() => setPage(p as number)} className={`w-7 h-7 text-xs rounded transition-colors ${p === page ? 'bg-[#1f6feb] text-white font-semibold' : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#c9d1d9]'}`}>{(p as number) + 1}</button>)}
            <button onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))} disabled={page >= pageCount - 1} className={pageBtnCls}>›</button>
            <button onClick={() => setPage(pageCount - 1)} disabled={page >= pageCount - 1} className={pageBtnCls}>»</button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-[#30363d] bg-[#161b22]">
        <CityCombobox locations={locations} value={newRate.destId} onChange={id => onNewRateChange({ ...newRate, destId: id })} />
        <div className="flex items-center gap-1"><span className="text-[#3fb950] font-mono text-sm font-bold">$</span><input type="number" placeholder="0.00" step="0.5" min="0" value={newRate.price} onChange={e => onNewRateChange({ ...newRate, price: e.target.value })} className={numInputCls} /></div>
        <button onClick={onAddRate} disabled={addSaving || !newRate.destId || !newRate.price} className="px-3 py-1.5 text-sm font-semibold rounded bg-[#1f6feb] hover:bg-[#388bfd] text-white disabled:opacity-40 transition-colors whitespace-nowrap">{addSaving ? '...' : '➕ Agregar'}</button>
      </div>
    </div>
  )
}
