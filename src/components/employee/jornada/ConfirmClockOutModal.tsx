interface ConfirmClockOutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  elapsed: number // seconds
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  return `${m}m`
}

export function ConfirmClockOutModal({
  isOpen, onClose, onConfirm, loading, elapsed,
}: ConfirmClockOutModalProps) {
  if (!isOpen) return null

  return (
    <div
      data-testid="confirm-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-clockout-title"
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2
            id="confirm-clockout-title"
            className="font-titles text-lg font-bold text-[var(--color-nc-dark)]"
          >
            ¿Finalizar jornada?
          </h2>
          <p className="font-subtitles text-sm text-[var(--color-nc-dark)]/60">
            Llevas <strong>{formatElapsed(elapsed)}</strong> trabajando hoy.
            Esta acción <strong>no se puede deshacer</strong>.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-subtitles text-amber-800">
          ⚠ Una vez finalizada la jornada no podrás reactivarla ni modificar las horas registradas.
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles text-white transition-all
              bg-[var(--color-nc-red)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Finalizando…' : '■ Finalizar jornada'}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full py-3 rounded-full text-sm font-bold font-subtitles transition-all
              border-2 border-[var(--color-nc-dark)]/20 text-[var(--color-nc-dark)] hover:bg-black/5
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
