'use client'

import { useState } from 'react'

interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  cancelLabel?: string
  isDirty?: boolean
  maxWidth?: 'sm' | 'md' | 'lg'
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  cancelLabel = 'Cancelar',
  isDirty = false,
  maxWidth = 'md',
}: ModalShellProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!isOpen) return null

  const maxWidthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[maxWidth]

  const handleClose = () => {
    if (isDirty) {
      setConfirmOpen(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setConfirmOpen(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className={`bg-white rounded-[var(--radius-xl)] shadow-xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col`}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">{title}</h2>
            {subtitle && (
              <p className="font-subtitles text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="btn-outline text-sm px-5 py-2.5"
          >
            {cancelLabel}
          </button>
          {footer}
        </div>
      </div>

      {/* Confirm discard dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-xl" aria-hidden="true">
              ⚠️
            </div>
            <h3 className="font-titles text-base font-extrabold text-[var(--color-foreground)] mb-2">
              ¿Descartar cambios?
            </h3>
            <p className="font-subtitles text-sm text-gray-500 mb-6">
              Tienes cambios sin guardar. Si cierras ahora los perderás.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-outline text-sm px-5 py-2.5"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="btn-danger text-sm px-5 py-2.5"
              >
                Sí, descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
