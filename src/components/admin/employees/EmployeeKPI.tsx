import { useMemo } from 'react'
import { Employee } from '@/types/admin/employees'

interface EmployeeKPIProps {
  employees: Employee[]
}

export function EmployeeKPI({ employees }: EmployeeKPIProps) {
  const activeCount = useMemo(() => {
    return employees.filter(emp => emp.status === 'ACTIVE').length
  }, [employees])

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-4 bg-[var(--color-foreground)] rounded-[var(--radius-xl)] px-6 py-5 min-w-[180px]">
        <div className="w-11 h-11 rounded-[var(--radius-xl)] bg-[var(--color-secondary)] flex items-center justify-center text-white text-xl flex-shrink-0">
          👥
        </div>
        <div>
          <p className="font-subtitles text-xs text-white/60 uppercase tracking-wide">Empleados Activos</p>
          <p className="font-titles text-3xl font-extrabold text-white leading-none mt-1">
            {activeCount}
          </p>
        </div>
      </div>
    </div>
  )
}
