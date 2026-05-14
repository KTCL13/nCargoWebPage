import { Employee } from '@/types/admin/employees'
import { avatarColor, initials, translateRole } from '@/lib/admin/employees/utils'

interface EmployeeTableProps {
  employees: Employee[]
  loading: boolean
  selected: Set<number>
  toggleSelect: (id: number) => void
  toggleSelectAll: () => void
  dirty: Record<number, 'ACTIVE' | 'INACTIVE'>
  saving: Set<number>
  toggleStatus: (id: number, current: 'ACTIVE' | 'INACTIVE') => void
  saveRow: (id: number) => void
  openModal: (emp: Employee, view: boolean) => void
  openContractModal: (emp: Employee) => void
}

export function EmployeeTable({
  employees, loading, selected, toggleSelect, toggleSelectAll,
  dirty, saving, toggleStatus, saveRow,
  openModal, openContractModal
}: EmployeeTableProps) {
  return (
    <div className="overflow-x-auto">
      <table role="grid" aria-label="Data table" className="w-full text-sm">
        <thead role="rowgroup">
          <tr role="row" className="border-b border-gray-100 bg-gray-50">
            <th role="columnheader" className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={employees.length > 0 && selected.size === employees.length}
                onChange={toggleSelectAll}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
            </th>
            <th role="columnheader" className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Nombre</th>
            <th role="columnheader" className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Rol</th>
            <th role="columnheader" className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Cargo</th>
            <th role="columnheader" className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Estado</th>
            <th role="columnheader" className="px-4 py-3 text-right font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {loading ? (
            <tr role="row">
              <td role="gridcell" colSpan={6} className="text-center py-12 text-gray-600 font-subtitles text-sm">
                Cargando...
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr role="row">
              <td role="gridcell" colSpan={6} className="text-center py-12 text-gray-600 font-subtitles text-sm">
                No se encontraron empleados
              </td>
            </tr>
          ) : employees.map(emp => {
            const currentStatus = dirty[emp.id] ?? emp.status
            const isDirty = dirty[emp.id] !== undefined
            const isSaving = saving.has(emp.id)

            return (
              <tr role="row" key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                <td role="gridcell" className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(emp.id)}
                    onChange={() => toggleSelect(emp.id)}
                    className="accent-[var(--color-primary)] w-4 h-4"
                  />
                </td>

                {/* Name */}
                <td role="gridcell" className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(emp.name)}`}>
                      {initials(emp.name)}
                    </div>
                    <div>
                      <p className="font-subtitles font-semibold text-[var(--color-foreground)]">{emp.name}</p>
                      <p className="text-xs text-gray-600">{emp.email}</p>
                    </div>
                  </div>
                </td>

                {/* Role */}
                <td role="gridcell" className="px-4 py-3">
                  <span className="font-subtitles text-gray-600 text-sm">
                    {translateRole(emp.roles[0] ?? '—')}
                  </span>
                </td>

                {/* Job Title */}
                <td role="gridcell" className="px-4 py-3">
                  <span className="text-xs font-medium font-subtitles text-gray-600 bg-gray-100 px-2 py-1 rounded-[var(--radius-md)]">
                    {emp.activeContract?.job.title ?? 'Sin cargo'}
                  </span>
                </td>

                {/* Status toggle */}
                <td role="gridcell" className="px-4 py-3">
                  <button
                    role="switch"
                    aria-checked={currentStatus === 'ACTIVE'}
                    onClick={() => toggleStatus(emp.id, emp.status)}
                    className="switch-btn"
                    aria-label={`Cambiar estado de ${emp.name} a ${currentStatus === 'ACTIVE' ? 'inactivo' : 'activo'}`}
                  >
                    <span className="switch-thumb" />
                  </button>
                </td>

                {/* Actions */}
                <td role="gridcell" className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-[var(--radius-lg)] shadow-sm border border-gray-100">
                      <button
                        onClick={() => openModal(emp, true)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[var(--radius-md)] transition-all"
                        title="Ver detalles"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => openModal(emp, false)}
                        className="p-1.5 text-[var(--color-primary)] hover:bg-red-50 rounded-[var(--radius-md)] transition-all"
                        title="Editar detalles"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => openContractModal(emp)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-[var(--radius-md)] transition-all"
                        title="Asignar nuevo contrato"
                      >
                        📝
                      </button>
                    </div>
                    
                    <button
                      onClick={() => saveRow(emp.id)}
                      disabled={!isDirty || isSaving}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-lg)] text-xs font-bold font-subtitles transition-all shadow-sm
                        ${isDirty && !isSaving
                          ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                          : 'bg-gray-100 text-gray-600 cursor-not-allowed border border-gray-200'
                        }
                      `}
                    >
                      {isSaving ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : '💾'}
                      <span>{isSaving ? 'Guardando' : 'Guardar'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
