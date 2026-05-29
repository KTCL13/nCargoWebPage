'use client'

import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'

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
  isOpen, onClose, title, setTitle, description, setDescription, onSave, saving,
}: NewTaskModalProps) {
  const isDirty = useDirtyForm(
    { title: '', description: '' },
    { title, description },
  )

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Tarea"
      subtitle="Agrega una tarea al tablero"
      isDirty={isDirty}
      maxWidth="sm"
      footer={
        <button
          onClick={onSave}
          disabled={!title.trim() || saving}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar Tarea'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
            Nombre de la tarea
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Revisión de contratos"
            className="form-input"
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
            className="form-input resize-none"
          />
        </div>
      </div>
    </ModalShell>
  )
}
