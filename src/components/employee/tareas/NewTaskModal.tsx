interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  setTitle: (t: string) => void
  description: string
  setDescription: (d: string) => void
  onSave: () => void
  saving: boolean
}

export function NewTaskModal({
  isOpen, onClose, title, setTitle, description, setDescription, onSave, saving
}: NewTaskModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 p-6 flex flex-col gap-4">
        <div>
          <p className="font-titles text-lg font-bold text-[var(--color-nc-dark)]">Nueva Tarea</p>
          <p className="font-subtitles text-xs text-[var(--color-nc-dark)]/50 mt-0.5">Agrega una tarea al tablero</p>
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
            Nombre de la tarea
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Revisión de contratos"
            className="border border-black/15 rounded-lg px-3 py-2 text-sm font-body text-[var(--color-nc-dark)] outline-none focus:border-[var(--color-nc-blue)] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe brevemente la tarea…"
            className="border border-black/15 rounded-lg px-3 py-2 text-sm font-body text-[var(--color-nc-dark)] outline-none focus:border-[var(--color-nc-blue)] transition-colors resize-none"
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-outline text-sm px-5 py-2 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={!title.trim() || saving}
            className="btn-primary text-sm px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Agregar Tarea'}
          </button>
        </div>
      </div>
    </div>
  )
}
