import { TaskItem, TimerState } from '@/lib/employee/jornada/types'

function formatHMS(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

interface TimerRingProps {
  elapsed: number
  progress: number
  stateLabel: string
  timerState: TimerState
  tasks: TaskItem[]
  selectedTaskId: number | null
  setSelectedTaskId: (id: number | null) => void
  onCompleteTask: () => void
  taskLoading: boolean
}

export function TimerRing({
  elapsed, progress, stateLabel, timerState, tasks,
  selectedTaskId, setSelectedTaskId, onCompleteTask, taskLoading
}: TimerRingProps) {
  const circumference = 2 * Math.PI * 90
  const strokeDash = circumference * progress

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col items-center justify-center gap-4 py-10 px-6">
      <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/60 uppercase tracking-wide">
        Sesión de Trabajo Actual
      </p>

      <div className="relative w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF003B" />
              <stop offset="100%" stopColor="#0C1E8C" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r="90" fill="none" stroke="#E4E6EA" strokeWidth="12" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke="url(#timerGrad)" strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-titles text-3xl font-extrabold text-[var(--color-nc-dark)] tabular-nums">
            {formatHMS(elapsed)}
          </span>
          <span className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-1">
            {stateLabel}
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 w-full max-w-sm">
        <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-full bg-[var(--color-nc-dark)]/5 min-w-0">
          <span className="text-sm flex-shrink-0">🎯</span>
          {timerState === 'idle' || timerState === 'closed' ? (
            <span className="font-subtitles text-sm text-[var(--color-nc-dark)]/60 truncate">
              Tarea actual: —
            </span>
          ) : tasks.length === 0 ? (
            <span className="font-subtitles text-sm text-[var(--color-nc-dark)]/50 truncate">
              Sin tareas pendientes
            </span>
          ) : (
            <select
              value={selectedTaskId ?? ''}
              onChange={e => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 bg-transparent font-subtitles text-sm text-[var(--color-nc-dark)] outline-none cursor-pointer min-w-0"
            >
              <option value="">— Seleccionar tarea —</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>
        {selectedTaskId !== null && (timerState === 'running' || timerState === 'paused') && (
          <button
            onClick={onCompleteTask}
            disabled={taskLoading}
            title="Marcar como completada"
            className="w-9 h-9 flex-shrink-0 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white font-bold text-base transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✓
          </button>
        )}
      </div>
    </div>
  )
}
