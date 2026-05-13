import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const TARGET_HOURS = 8

interface HoursChartProps {
  hoursPerDay: number[]
  loading: boolean
}

export function HoursChart({ hoursPerDay, loading }: HoursChartProps) {
  const barData = useMemo(() => ({
    labels: WEEK_DAYS,
    datasets: [{
      label: 'Horas',
      data: hoursPerDay,
      backgroundColor: '#FF003B',
      borderRadius: 6,
    }],
  }), [hoursPerDay])

  const barOpts = useMemo(() => ({
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: Math.max(TARGET_HOURS, ...hoursPerDay, 1), ticks: { stepSize: 2 } },
    },
  }), [hoursPerDay])

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
      <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Horas por Día</p>
      <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución semanal</p>
      {loading ? (
        <div className="h-40 flex items-center justify-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles">Cargando…</div>
      ) : (
        <Bar data={barData} options={barOpts} />
      )}
    </div>
  )
}
