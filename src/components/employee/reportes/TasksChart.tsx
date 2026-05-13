import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'

const TASK_COLORS: Record<string, string> = {
  PENDING:     '#F59E0B',
  IN_PROGRESS: '#3B82F6',
  COMPLETED:   '#22C55E',
  NOT_DONE:    '#EF4444',
  CANCELLED:   '#9CA3AF',
}

const TASK_LABELS: Record<string, string> = {
  PENDING:     'Pendientes',
  IN_PROGRESS: 'En Proceso',
  COMPLETED:   'Completadas',
  NOT_DONE:    'No Hechas',
  CANCELLED:   'Canceladas',
}

interface TasksChartProps {
  taskCounts: Record<string, number>
  loading: boolean
}

export function TasksChart({ taskCounts, loading }: TasksChartProps) {
  const doughnutData = useMemo(() => {
    const statuses = Object.keys(taskCounts).filter(k => taskCounts[k] > 0)
    if (statuses.length === 0) {
      return {
        labels: ['Sin tareas'],
        datasets: [{ data: [1], backgroundColor: ['#E5E7EB'], borderWidth: 0 }],
      }
    }
    return {
      labels: statuses.map(s => TASK_LABELS[s] ?? s),
      datasets: [{
        data: statuses.map(s => taskCounts[s]),
        backgroundColor: statuses.map(s => TASK_COLORS[s] ?? '#9CA3AF'),
        borderWidth: 0,
      }],
    }
  }, [taskCounts])

  const doughnutOpts = {
    responsive: true,
    cutout: '68%',
    plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 11 } } } },
  }

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
      <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">Estado de Tareas</p>
      <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mb-4">Distribución actual</p>
      {loading ? (
        <div className="h-40 flex items-center justify-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles">Cargando…</div>
      ) : (
        <Doughnut data={doughnutData} options={doughnutOpts} />
      )}
    </div>
  )
}
