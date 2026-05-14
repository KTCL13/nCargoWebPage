import { Shipment, RowFeedback } from '@/lib/employee/envios/types'
import { Pagination } from '@/components/ui/Pagination'

interface ShipmentsTableProps {
  shipments: Shipment[]
  loading: boolean
  editingId: number | null
  setEditingId: (id: number | null) => void
  editValue: string
  setEditValue: (v: string) => void
  saveTracking: (s: Shipment) => void
  saving: boolean
  rowFeedback: RowFeedback | null
  startEdit: (s: Shipment) => void
  page: number
  setPage: (p: number) => void
  pageSize: number
  setPageSize: (s: number) => void
  total: number
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })

export function ShipmentsTable({
  shipments, loading, editingId, setEditingId, editValue, setEditValue,
  saveTracking, saving, rowFeedback, startEdit,
  page, setPage, pageSize, setPageSize, total
}: ShipmentsTableProps) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table role="grid" aria-label="Data table" className="w-full text-left text-sm">
          <thead role="rowgroup" className="bg-gray-50 border-b">
            <tr role="row">
              {['#ID', 'Paquete', 'Cliente', 'Etapa', 'Tracking Number', 'Estado', 'Fecha', 'Acción'].map(h => (
                <th role="columnheader" key={h} className="px-4 py-3 text-xs text-gray-600 uppercase font-bold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="divide-y">
            {loading ? (
              <tr role="row"><td role="gridcell" colSpan={8} className="p-10 text-center text-gray-600">Cargando...</td></tr>
            ) : shipments.length === 0 ? (
              <tr role="row"><td role="gridcell" colSpan={8} className="p-10 text-center text-gray-600">No hay envíos de casilleros</td></tr>
            ) : shipments.map(s => (
              <tr role="row" key={s.id} className="hover:bg-gray-50 transition">
                <td role="gridcell" className="px-4 py-3 font-bold text-gray-700">#{s.id}</td>
                <td role="gridcell" className="px-4 py-3 font-semibold text-gray-800 max-w-[160px] truncate" title={s.odooTaskName ?? ''}>
                  {s.odooTaskName ?? `Envío #${s.id}`}
                </td>
                <td role="gridcell" className="px-4 py-3 text-xs">{s.odooCustomerName ?? '—'}</td>
                <td role="gridcell" className="px-4 py-3 text-xs text-gray-500">{s.odooStageName ?? '—'}</td>
                <td role="gridcell" className="px-4 py-3">
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
                      {s.trackingNumber || <span className="text-gray-500">Sin tracking</span>}
                    </span>
                  )}
                  {rowFeedback?.id === s.id && (
                    <span className={`ml-2 text-xs font-bold ${rowFeedback.ok ? 'text-green-600' : 'text-red-600'}`}>
                      {rowFeedback.msg}
                    </span>
                  )}
                </td>
                <td role="gridcell" className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                    {s.status?.name ?? 'N/A'}
                  </span>
                </td>
                <td role="gridcell" className="px-4 py-3 text-xs text-gray-600">{fmtDate(s.createdAt)}</td>
                <td role="gridcell" className="px-4 py-3">
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
  )
}
