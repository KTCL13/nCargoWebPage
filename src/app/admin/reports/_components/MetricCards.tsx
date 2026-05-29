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
    accentHex: 'var(--color-nc-blue)',
    format: (v: number | null) => (v != null && !isNaN(v)) ? `${v.toFixed(1)}h` : '—',
  },
  {
    key: 'totalTasksCompleted' as const,
    icon: '✅',
    label: 'Tareas completadas',
    sub: 'Total acumulado',
    accentHex: '#22c55e',
    format: (v: number | null) => (v != null && !isNaN(v)) ? String(v) : '—',
  },
  {
    key: 'avgProductivity' as const,
    icon: '🎯',
    label: 'Productividad prom.',
    sub: 'Score promedio',
    accentHex: 'var(--color-nc-red)',
    format: (v: number | null) => (v != null && !isNaN(v)) ? `${v.toFixed(1)}%` : '—',
  },
  {
    key: 'avgTaskTime' as const,
    icon: '⚡',
    label: 'Tiempo por tarea',
    sub: 'Promedio por tarea',
    accentHex: '#f59e0b',
    format: (v: number | null) => (v != null && !isNaN(v)) ? `${Math.round(v)}m` : '—',
  },
] as const

export function MetricCards({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {CARDS.map((card, idx) => {
        const raw = metrics[card.key] as number | null
        return (
          <div
            key={card.key}
            className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 transition-[opacity,transform,box-shadow] hover:shadow-md hover:translate-y-[-2px] hover:border-[var(--color-primary)]/20"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300"
              style={{ backgroundColor: card.accentHex.startsWith('var(') ? `color-mix(in srgb, ${card.accentHex} 8%, transparent)` : card.accentHex + '15' }}
            >
              <span className="drop-shadow-sm">{card.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="font-subtitles text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">
                {card.label}
              </p>
              <p className="font-titles text-2xl font-black text-[var(--color-foreground)] leading-tight tabular-nums">
                {card.format(raw)}
              </p>
              <p className="font-subtitles text-[10px] text-gray-400/80 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                {card.sub}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
