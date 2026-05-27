'use client'

import { useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/context/AuthContext'
import { EmployeeSearch } from '@/components/ui/EmployeeSearch'
import { useAttendance } from '@/lib/admin/attendance/useAttendance'
import { STATUS_COLORS, STATUS_LABELS } from '@/types/admin/attendance'
import { useTableSort } from '@/hooks/useTableSort'

export default function AsistenciaAdminPage() {
  const { token } = useAuth()
  const {
    registries, total, page, setPage, pageSize, setPageSize, loading,
    dateFilter, setDateFilter, employeeFilter, setEmployeeFilter, statusFilter, setStatusFilter,
    fetchAttendance, handleCloseJourney
  } = useAttendance(token)

  const { sortColumn, sortDirection, handleSort, sortedItems: sortedRegistries } = useTableSort(
    registries,
    { column: '' as string, direction: 'asc' },
    (r, column) => {
      switch (column) {
        case 'employee': return r.employee ? `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase() : String(r.employeeId);
        case 'date': return new Date(r.startedAt).getTime();
        case 'start': return new Date(r.startedAt).getTime();
        case 'end': return r.endedAt ? new Date(r.endedAt).getTime() : Infinity;
        case 'hours': return Number(r.workedHours || 0);
        case 'status': return STATUS_LABELS[r.status];
        default: return '';
      }
    }
  );

  const openJourneys = useMemo(() => registries.filter(r => r.status === 'OPEN').length, [registries])

  const fmtTime = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const fmtDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  }

  return (
    <DashboardLayout pageTitle="Control de Asistencia" navItems={NAV_ITEMS} onReload={fetchAttendance}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-titles text-2xl font-extrabold text-[var(--color-foreground)]">Bitácora de Asistencia</h1>
            <p className="text-gray-500 text-sm">Monitoreo de entradas, salidas y tiempos de trabajo</p>
          </div>
          {openJourneys > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-[var(--radius-lg)] px-4 py-2 flex items-center gap-2 animate-pulse">
              <span className="text-red-600 text-sm font-bold">🚨 {openJourneys} Jornadas activas sin cerrar</span>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-[var(--radius-xl)] border border-gray-100 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Fecha</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="form-input w-full" />
          </div>
          <div className="flex-[2] min-w-[300px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Empleado</label>
            <EmployeeSearch
              onSelect={emp => setEmployeeFilter(emp ? String(emp.id) : '')} placeholder="Nombre o identificación..." className="w-full" />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block ml-1">Estado</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-full">
              <option value="">Todos los estado</option>
              <option value="OPEN">Abierta</option>
              <option value="PAUSED">En Pausa</option>
              <option value="CLOSED">Finalizada</option>
            </select>
          </div>
          <button onClick={() => fetchAttendance()} className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-[var(--radius-lg)] font-bold text-sm hover:opacity-90 transition">
            Actualizar
          </button>
        </div>

        <div className="bg-white rounded-[var(--radius-xl)] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  {["Empleado", "Fecha", "Entrada", "Salida", "Horas", "Estado", "Acción"].map(h => {
                    const columnKeyMap: Record<string, string> = {
                      Empleado: 'employee',
                      Fecha: 'date',
                      Entrada: 'start',
                      Salida: 'end',
                      Horas: 'hours',
                      Estado: 'status',
                      Acción: ''
                    };
                    const colKey = columnKeyMap[h];
                    const isSortable = colKey !== '';
                    return (
                      <th
                        key={h}
                        className={`px-5 py-3 text-left font-subtitles text-xs uppercase text-gray-500 ${isSortable ? 'cursor-pointer select-none hover:bg-gray-100 transition' : ''} ${h === 'Acción' ? 'text-right' : ''}`}
                        onClick={isSortable ? () => handleSort(colKey) : undefined}
                      >
                        {h}
                        {isSortable && (
                          <span className={`ml-1 ${sortColumn === colKey ? 'text-[var(--color-primary)]' : 'opacity-20'}`}>
                            {sortColumn === colKey ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">Cargando bitácora...</td></tr>
                ) : sortedRegistries.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-gray-400">No hay registros para los filtros seleccionados</td></tr>
                ) : sortedRegistries.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-[var(--color-foreground)]">
                      {r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : `ID: ${r.employeeId}`}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{fmtDate(r.startedAt)}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{fmtTime(r.startedAt)}</td>
                    <td className="px-5 py-4 font-mono text-gray-700">{fmtTime(r.endedAt)}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{Number(r.workedHours || 0).toFixed(2)}h</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[r.status]}`}>
                        {STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {r.status !== 'CLOSED' &&
                        <button onClick={() => handleCloseJourney(r.id)} className="text-xs font-bold text-red-600 hover:underline">
                          Cerrar manualmente
                        </button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-gray-100">
            <Pagination page={page} pageSize={pageSize} totalItems={total} onPageChange={setPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
