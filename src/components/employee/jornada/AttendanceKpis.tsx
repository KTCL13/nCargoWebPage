interface AttendanceKpisProps {
  hoursToday: string
  attendance: any
  pauseCount: number
  stateLabel: string
}

export function AttendanceKpis({ hoursToday, attendance, pauseCount, stateLabel }: AttendanceKpisProps) {
  const cards = [
    { icon: '⏱️', label: 'Horas hoy', value: `${hoursToday}h` },
    { icon: '✅', label: 'Sesiones', value: attendance ? '1' : '0' },
    { icon: '⏸️', label: 'Pausas', value: pauseCount },
    { icon: '📍', label: 'Estado', value: stateLabel },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className="flex items-center gap-3 bg-[var(--color-nc-dark)] rounded-2xl px-5 py-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-nc-blue)] flex items-center justify-center text-lg flex-shrink-0">
            {card.icon}
          </div>
          <div>
            <p className="font-subtitles text-[11px] text-white/60 uppercase tracking-wide">{card.label}</p>
            <p className="font-titles text-xl font-extrabold text-white leading-tight">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
