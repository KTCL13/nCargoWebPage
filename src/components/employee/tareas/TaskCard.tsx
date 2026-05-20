import { Task, TaskStatus } from '@/lib/employee/tareas/types'

interface TaskCardProps {
  task: Task
  archived?: boolean
  canUpdate: boolean
  onUpdateStatus: (id: number, status: TaskStatus) => void
  showStatusLabel?: boolean
}

function statusLabel(s: TaskStatus) {
  const map: Record<TaskStatus, string> = {
    PENDING: 'Pendiente', IN_PROGRESS: 'En proceso',
    COMPLETED: 'Completado', CANCELLED: 'Cancelado', NOT_DONE: 'No realizado',
  }
  return map[s]
}

export function TaskCard({ task, archived, canUpdate, onUpdateStatus, showStatusLabel }: TaskCardProps) {
  return (
    <div
      className={`rounded-xl p-3 flex flex-col gap-2 border ${archived ? 'bg-gray-50 border-black/5 opacity-75' : 'bg-[#F7F8FA] border-black/5'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-subtitles font-semibold text-sm text-[var(--color-nc-dark)] leading-tight">{task.title}</p>
        {showStatusLabel && (
          <span className="text-[10px] font-subtitles text-gray-600 bg-gray-100 rounded-full px-2 py-0.5 flex-shrink-0">
            {statusLabel(task.status)}
          </span>
        )}
      </div>
      {task.description && (
        <p className="font-body text-xs text-[var(--color-nc-dark)]/50 leading-relaxed">{task.description}</p>
      )}

      {(task.startTime || task.endTime) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-subtitles text-[var(--color-nc-dark)]/50 mt-0.5">
          {task.status === 'COMPLETED' && task.endTime && (
            <span>✓ {new Date(task.endTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {task.status !== 'COMPLETED' && task.endTime && (
            <span>📅 {new Date(task.endTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {task.status === 'IN_PROGRESS' && task.startTime && (
            <span>▶ {new Date(task.startTime).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          )}
        </div>
      )}

      {!archived && (
        <div className="flex gap-1 flex-wrap mt-1">
          {task.status === 'PENDING' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'IN_PROGRESS')}
              disabled={!canUpdate}
              className="text-xs px-3 py-1 rounded-full bg-[var(--color-nc-red)] text-white font-subtitles font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ▶ Iniciar
            </button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <button
              onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
              disabled={!canUpdate}
              className="text-xs px-3 py-1 rounded-full bg-green-500 text-white font-subtitles font-semibold hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✓ Completar
            </button>
          )}
          <button
            onClick={() => onUpdateStatus(task.id, 'CANCELLED')}
            disabled={!canUpdate}
            className="text-xs px-3 py-1 rounded-full border border-black/15 text-[var(--color-nc-dark)]/50 font-subtitles hover:bg-black/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
