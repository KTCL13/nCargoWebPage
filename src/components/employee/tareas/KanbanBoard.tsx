import { Task, Column, TaskStatus } from '@/lib/employee/tareas/types'
import { TaskCard } from './TaskCard'

interface KanbanBoardProps {
  tasks: Task[]
  canUpdate: boolean
  onUpdateStatus: (id: number, status: TaskStatus) => void
}

const COLUMNS: Column[] = [
  { statuses: ['PENDING'],                  label: 'Por Hacer',   dot: '#9CA3AF' },
  { statuses: ['IN_PROGRESS'],              label: 'En Proceso',  dot: 'var(--color-nc-red)' },
  { statuses: ['COMPLETED'],                label: 'Completado',  dot: '#22C55E' },
  { statuses: ['CANCELLED', 'NOT_DONE'],    label: 'Cancelado',   dot: '#6B7280', archived: true },
]

export function KanbanBoard({ tasks, canUpdate, onUpdateStatus }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => (col.statuses as TaskStatus[]).includes(t.status))
        return (
          <div key={col.statuses.join('+')} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                <span className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)]">{col.label}</span>
              </div>
              <span className="font-subtitles text-xs font-bold text-white bg-[var(--color-nc-dark)] rounded-full w-6 h-6 flex items-center justify-center">
                {colTasks.length}
              </span>
            </div>

            {colTasks.length === 0 && (
              <p className="text-center text-xs text-[var(--color-nc-dark)]/30 font-subtitles py-6">Sin tareas</p>
            )}
            {colTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                archived={col.archived}
                canUpdate={canUpdate}
                onUpdateStatus={onUpdateStatus}
                showStatusLabel={col.statuses.length > 1}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}
