import React from 'react'

interface AdminModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  error?: string | null
  loading?: boolean
  hideFooter?: boolean
  disableSubmit?: boolean
  submitText: string
  submitButtonClass?: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

export function AdminModal({
  isOpen,
  onClose,
  title,
  description,
  error,
  loading,
  hideFooter,
  disableSubmit,
  submitText,
  submitButtonClass = 'bg-[var(--color-primary)] hover:opacity-90',
  onSubmit,
  children
}: AdminModalProps) {
  if (!isOpen) return null

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">{title}</h2>
            {description && <p className="font-subtitles text-sm text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={onSubmit} className="px-6 py-5 flex flex-col gap-5">
          {children}
          
          {error && (
            <p className="text-red-600 text-xs bg-red-50 p-3 rounded-[var(--radius-lg)] border border-red-100 font-medium">
              ⚠️ {error}
            </p>
          )}

          {!hideFooter && (
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-[var(--radius-lg)] font-bold text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || disableSubmit}
                className={`flex-[2] px-4 py-3 text-white rounded-[var(--radius-lg)] font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 ${submitButtonClass}`}
              >
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {submitText}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
