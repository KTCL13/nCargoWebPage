import { TimerState } from '@/lib/employee/jornada/types'

interface ControlPanelProps {
  timerState: TimerState
  loading: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  sessionStart: string
  pauseCount: number
  stateLabel: string
}

export function ControlPanel({
  timerState, loading, onStart, onPause, onResume, onStop,
  sessionStart, pauseCount, stateLabel
}: ControlPanelProps) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 flex flex-col gap-3">
      <div>
        <p className="font-titles text-base font-bold text-[var(--color-nc-dark)]">Panel de Control</p>
        <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5">Registra tus horas de trabajo</p>
      </div>

      <button
        onClick={onStart}
        disabled={timerState !== 'idle' || loading}
        className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
          bg-[var(--color-nc-red)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ▶ INICIAR
      </button>
      <button
        onClick={onPause}
        disabled={timerState !== 'running' || loading}
        className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
          bg-[var(--color-nc-dark)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ⏸ PAUSAR
      </button>
      <button
        onClick={onResume}
        disabled={timerState !== 'paused' || loading}
        className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
          bg-amber-500 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ↺ REANUDAR
      </button>
      <button
        onClick={onStop}
        disabled={(timerState !== 'running' && timerState !== 'paused') || loading}
        className="w-full py-3 rounded-full text-sm font-bold font-subtitles transition-all
          border-2 border-[var(--color-nc-dark)]/20 text-[var(--color-nc-dark)] hover:bg-black/5
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ■ FINALIZAR
      </button>

      <hr className="border-black/8 my-1" />

      <div className="flex flex-col gap-2">
        {[
          { label: 'Inicio de sesión', value: sessionStart },
          { label: 'Pausas', value: pauseCount },
          { label: 'Estado', value: stateLabel },
        ].map(row => (
          <div key={row.label} className="flex justify-between items-center text-sm">
            <span className="font-subtitles text-[var(--color-nc-dark)]/50">{row.label}</span>
            <strong className="font-subtitles font-semibold text-[var(--color-nc-dark)]">{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}
