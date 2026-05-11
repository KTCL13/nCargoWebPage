export type Metrics = {
  totalWorkedHours: number
  totalTasksCompleted: number
  avgProductivity: number | null
  avgTaskTime: number | null
}

const CARDS = [
  {
    key: 'totalWorkedHours' as const,
    icon: '⏱️',
    label: 'Horas trabajadas',
    sub: 'Suma del período',
    accentHex: '#0C1E8C',
    format: (v: number | null) => v != null ? `${v.toFixed(1)}h` : '—',
  },
  {
    key: 'totalTasksCompleted' as const,
    icon: '✅',
    label: 'Tareas completadas',
    sub: 'Total acumulado',
    accentHex: '#22c55e',
    format: (v: number | null) => v != null ? String(v) : '—',
  },
  {
    key: 'avgProductivity' as const,
    icon: '🎯',
    label: 'Productividad prom.',
    sub: 'Score promedio',
    accentHex: '#FF003B',
    format: (v: number | null) => v != null ? `${v.toFixed(1)}%` : '—',
  },
  {
    key: 'avgTaskTime' as const,
    icon: '⚡',
    label: 'Tiempo por tarea',
    sub: 'Promedio por tarea',
    accentHex: '#f59e0b',
    format: (v: number | null) => v != null ? `${Math.round(v)}m` : '—',
  },
] as const

export function MetricCards({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(card => {
        const raw = metrics[card.key] as number | null
        return (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex items-start gap-4"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: card.accentHex + '1a' }}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="font-subtitles text-[11px] text-[var(--color-nc-dark)]/50 uppercase tracking-wide leading-none mb-1">
                {card.label}
              </p>
              <p className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)] leading-tight tabular-nums">
                {card.format(raw)}
              </p>
              <p className="font-subtitles text-[11px] text-[var(--color-nc-dark)]/35 mt-0.5">
                {card.sub}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
