import { Role } from '@/types/admin/employees'
import { translateRole } from '@/lib/admin/employees/utils'

interface EmployeeFiltersProps {
  filterStatus: string
  setFilterStatus: (val: string) => void
  filterRole: string
  setFilterRole: (val: string) => void
  search: string
  setSearch: (val: string) => void
  roles: Role[]
  onAddEmployee: () => void
  setPage: (page: number) => void
}

export function EmployeeFilters({
  filterStatus, setFilterStatus,
  filterRole, setFilterRole,
  search, setSearch,
  roles, onAddEmployee,
  setPage
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/30">
      <h2 className="font-titles text-lg font-bold text-[var(--color-foreground)]">
        Listado de Empleados
      </h2>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
            className="text-xs font-subtitles px-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 bg-white focus:border-[var(--color-primary)] outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
          <select
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value); setPage(0) }}
            className="text-xs font-subtitles px-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 bg-white focus:border-[var(--color-primary)] outline-none"
          >
            <option value="">Tipo de trabajador</option>
            {roles.map(r => <option key={r.id} value={r.id}>{translateRole(r.name)}</option>)}
          </select>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Nombre, apellido o cédula..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="pl-8 pr-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 text-xs font-subtitles focus:outline-none focus:border-[var(--color-primary)] w-52"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs">🔍</span>
        </div>
        <button
          onClick={onAddEmployee}
          className="bg-[var(--color-primary)] text-white text-xs font-subtitles font-semibold px-4 py-2 rounded-[var(--radius-lg)] hover:opacity-90 transition whitespace-nowrap"
        >
          + Añadir empleado
        </button>
      </div>
    </div>
  )
}
