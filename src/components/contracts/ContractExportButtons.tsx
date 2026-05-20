'use client'

import { useState } from 'react'
import { authFetch } from '@/lib/api-client/auth-fetch'

type ExportFormat = 'xlsx' | 'pdf'

interface ContractExportButtonsProps {
  /** ID of the employee whose contracts to export */
  employeeId: number
  /** Name shown in the file (used as download label) */
  employeeName: string
  /** ID of the admin who triggered the export (from auth context) */
  generatedBy: number
  /** Bearer token for the Authorization header */
  token: string
}

interface ExportState {
  loading: boolean
  error: string | null
}

export function ContractExportButtons({
  employeeId,
  employeeName,
  generatedBy,
  token,
}: ContractExportButtonsProps) {
  const [xlsxState, setXlsxState] = useState<ExportState>({ loading: false, error: null })
  const [pdfState,  setPdfState]  = useState<ExportState>({ loading: false, error: null })

  async function handleExport(format: ExportFormat) {
    const setState = format === 'xlsx' ? setXlsxState : setPdfState

    setState({ loading: true, error: null })

    try {
      const res = await authFetch('/api/employees/contracts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId, format, generatedBy }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: 'Error al exportar' }))
        throw new Error(data.message ?? 'Error al exportar')
      }

      // Trigger browser download via blob URL
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      const ext  = format === 'xlsx' ? 'xlsx' : 'pdf'
      a.href     = url
      a.download = `contratos_${employeeName.replace(/\s+/g, '_')}_${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      setState({ loading: false, error: null })
    } catch (err: unknown) {
      setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  return (
    <div className="contract-export-buttons">
      {/* ── Excel button ── */}
      <div className="export-btn-wrapper">
        <button
          id="btn-export-excel"
          onClick={() => handleExport('xlsx')}
          disabled={xlsxState.loading || pdfState.loading}
          aria-label="Exportar historial de contratos en Excel"
          className="export-btn export-btn--excel"
        >
          {xlsxState.loading ? (
            <span className="export-spinner" aria-hidden="true" />
          ) : (
            <ExcelIcon />
          )}
          <span>{xlsxState.loading ? 'Generando…' : 'Exportar Excel'}</span>
        </button>

        {xlsxState.error && (
          <div className="export-error" role="alert">
            <span>{xlsxState.error}</span>
            <button
              onClick={() => setXlsxState(s => ({ ...s, error: null }))}
              aria-label="Cerrar error de Excel"
              className="export-error-dismiss"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ── PDF button ── */}
      <div className="export-btn-wrapper">
        <button
          id="btn-export-pdf"
          onClick={() => handleExport('pdf')}
          disabled={xlsxState.loading || pdfState.loading}
          aria-label="Exportar historial de contratos en PDF"
          className="export-btn export-btn--pdf"
        >
          {pdfState.loading ? (
            <span className="export-spinner" aria-hidden="true" />
          ) : (
            <PdfIcon />
          )}
          <span>{pdfState.loading ? 'Generando…' : 'Exportar PDF'}</span>
        </button>

        {pdfState.error && (
          <div className="export-error" role="alert">
            <span>{pdfState.error}</span>
            <button
              onClick={() => setPdfState(s => ({ ...s, error: null }))}
              aria-label="Cerrar error de PDF"
              className="export-error-dismiss"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── inline SVG icons ───────────────────────────────────────────────────────

function ExcelIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="18" rx="2" fill="#166534" opacity="0.9" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <rect x="2" y="3" width="20" height="18" rx="2" stroke="#fff" strokeWidth="0.5" opacity="0.3" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="13" height="17" rx="2" fill="#FF003B" opacity="0.9" />
      <path d="M14 2l7 7h-7V2z" fill="#FF003B" opacity="0.7" />
      <path d="M7 12h6M7 15h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
