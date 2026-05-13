import { AttendanceRecord } from '@/lib/employee/reportes/types'

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[]
  loading: boolean
  totalAccumulated: number
}

function formatDuration(hours: number) {
  if (!hours) return '—'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function statusBadge(status: string) {
  if (status === 'CLOSED') return 'bg-green-100 text-green-700'
  if (status === 'PAUSED') return 'bg-amber-100 text-amber-700'
  return 'bg-blue-100 text-blue-700'
}

const STATUS_LABEL: Record<string, string> = {
  CLOSED: 'Completada', PAUSED: 'Pausada', OPEN: 'Activa',
}

export function AttendanceHistoryTable({ records, loading, totalAccumulated }: AttendanceHistoryTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
        <div>
          <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Historial de Sesiones</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50">
            Total acumulado:{' '}
            <strong className="text-[var(--color-nc-red)]">
              {loading ? '…' : formatDuration(totalAccumulated)}
            </strong>
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-10 text-sm text-[var(--color-nc-dark)]/40 font-subtitles">Cargando…</p>
      ) : records.length === 0 ? (
        <p className="text-center py-10 text-sm text-[var(--color-nc-dark)]/40 font-subtitles">Sin registros</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-subtitles">
            <thead className="bg-[#F7F8FA]">
              <tr>
                {['Fecha', 'Hora Inicio', 'Hora Fin', 'Tiempo Total', 'Estado'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-[var(--color-nc-dark)]/50 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => {
                const start = new Date(r.startedAt)
                const end   = r.endedAt ? new Date(r.endedAt) : null
                return (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F7F8FA]/50'}>
                    <td className="px-6 py-3 text-[var(--color-nc-dark)]">
                      {start.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-nc-dark)] tabular-nums">
                      {start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-[var(--color-nc-dark)] tabular-nums">
                      {end ? end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-3 font-semibold text-[var(--color-nc-dark)] tabular-nums">
                      {formatDuration(Number(r.workedHours ?? 0))}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(r.status)}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
