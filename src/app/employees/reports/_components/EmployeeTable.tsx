'use client'

import { useMemo, useState } from 'react'

export type EmployeeRow = {
  employeeId: number
  name: string
  totalWorkedHours: number
  tasksCompleted: number
  avgTaskTime: number | null
  avgProductivity: number | null
}

type SortKey = 'totalWorkedHours' | 'tasksCompleted' | 'avgProductivity'

const COL_HEADERS: { label: string; sortKey: SortKey | null; align?: string }[] = [
  { label: 'Empleado',          sortKey: null },
  { label: 'Horas totales',     sortKey: 'totalWorkedHours' },
  { label: 'Tareas completadas',sortKey: 'tasksCompleted' },
  { label: 'Tiempo prom.',      sortKey: null },
  { label: 'Productividad',     sortKey: 'avgProductivity' },
]

function scoreStyle(score: number | null) {
  if (score == null) return 'bg-gray-100 text-gray-400'
  if (score >= 80)   return 'bg-green-100 text-green-700'
  if (score >= 60)   return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

export function EmployeeTable({ rows }: { rows: EmployeeRow[] }) {
  const [sortKey, setSortKey]   = useState<SortKey>('avgProductivity')
  const [sortDir, setSortDir]   = useState<'desc' | 'asc'>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    const getValue = (r: EmployeeRow): number => {
      if (sortKey === 'avgProductivity') return r.avgProductivity ?? -1
      if (sortKey === 'tasksCompleted')  return r.tasksCompleted
      return r.totalWorkedHours
    }
    return [...rows].sort((a, b) => {
      const diff = getValue(a) - getValue(b)
      return sortDir === 'desc' ? -diff : diff
    })
  }, [rows, sortKey, sortDir])

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
        <div>
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">
            Rendimiento por empleado
          </p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/40 mt-0.5">
            {rows.length} empleado{rows.length !== 1 ? 's' : ''} con datos en el período
          </p>
        </div>
        <span className="hidden sm:inline-block font-subtitles text-xs text-[var(--color-nc-dark)]/30 italic">
          Haz clic en el encabezado para ordenar
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-center py-12 text-sm font-subtitles text-[var(--color-nc-dark)]/30">
          Sin datos para este período
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-subtitles">
            <thead className="bg-[#F7F8FA]">
              <tr>
                {COL_HEADERS.map(col => (
                  <th
                    key={col.label}
                    onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
                    className={[
                      'text-left px-6 py-3 text-xs font-semibold text-[var(--color-nc-dark)]/50 uppercase tracking-wide whitespace-nowrap',
                      col.sortKey ? 'cursor-pointer select-none hover:text-[var(--color-nc-dark)] transition-colors' : '',
                    ].join(' ')}
                  >
                    {col.label}
                    {col.sortKey && (
                      <span className="ml-1 inline-block w-3 text-center">
                        {sortKey === col.sortKey
                          ? sortDir === 'desc' ? '↓' : '↑'
                          : <span className="opacity-25">↕</span>}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={row.employeeId}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]/60'}
                >
                  {/* Name */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-nc-blue)]/10 flex items-center justify-center text-xs font-bold text-[var(--color-nc-blue)] flex-shrink-0">
                        {initials(row.name)}
                      </div>
                      <span className="font-semibold text-[var(--color-nc-dark)] whitespace-nowrap">
                        {row.name}
                      </span>
                    </div>
                  </td>

                  {/* Hours */}
                  <td className="px-6 py-3.5 tabular-nums text-[var(--color-nc-dark)]">
                    {row.totalWorkedHours.toFixed(1)}h
                  </td>

                  {/* Tasks */}
                  <td className="px-6 py-3.5 tabular-nums text-[var(--color-nc-dark)]">
                    {row.tasksCompleted}
                  </td>

                  {/* Avg task time */}
                  <td className="px-6 py-3.5 text-[var(--color-nc-dark)]">
                    {row.avgTaskTime != null ? `${Math.round(row.avgTaskTime)}m` : '—'}
                  </td>

                  {/* Productivity badge */}
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${scoreStyle(row.avgProductivity)}`}>
                      {row.avgProductivity != null ? `${row.avgProductivity.toFixed(1)}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
