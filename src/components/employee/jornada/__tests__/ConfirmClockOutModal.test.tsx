/**
 * @jest-environment jsdom
 *
 * Spec OB-15 — Modal de confirmación para "Finalizar jornada"
 *
 * Requerimientos Nielsen #3 (control y libertad) y #5 (prevención de errores):
 * - El botón FINALIZAR NO debe ejecutar clock-out directamente.
 * - Debe mostrar un modal de confirmación que informe que la acción es irreversible.
 * - El empleado puede cancelar sin consecuencias.
 * - Solo tras confirmar explícitamente se dispara el clock-out.
 */
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmClockOutModal } from '../ConfirmClockOutModal'

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  onConfirm: jest.fn(),
  loading: false,
  elapsed: 3661, // 1h 1m 1s
}

beforeEach(() => jest.clearAllMocks())

// ── Visibilidad ──────────────────────────────────────────────────────────────

describe('visibilidad', () => {
  it('no renderiza nada cuando isOpen=false', () => {
    render(<ConfirmClockOutModal {...baseProps} isOpen={false} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renderiza el dialog cuando isOpen=true', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

// ── Contenido informativo ────────────────────────────────────────────────────

describe('contenido', () => {
  it('muestra advertencia de acción irreversible', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument()
  })

  it('muestra las horas trabajadas formateadas', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    // 3661s = 1h 01m
    expect(screen.getByText(/1h 01m/i)).toBeInTheDocument()
  })

  it('muestra horas sin prefijo "h" cuando elapsed < 3600s', () => {
    render(<ConfirmClockOutModal {...baseProps} elapsed={900} />) // 15m
    expect(screen.getByText(/15m/i)).toBeInTheDocument()
  })
})

// ── Flujo de cancelación (Nielsen #3) ────────────────────────────────────────

describe('cancelación', () => {
  it('llama onClose al hacer click en "Cancelar", NO llama onConfirm', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
    expect(baseProps.onConfirm).not.toHaveBeenCalled()
  })

  it('llama onClose al hacer click en el backdrop', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    fireEvent.click(screen.getByTestId('confirm-modal-backdrop'))
    expect(baseProps.onClose).toHaveBeenCalledTimes(1)
    expect(baseProps.onConfirm).not.toHaveBeenCalled()
  })

  it('NO propaga el click del contenido del dialog al backdrop', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(baseProps.onClose).not.toHaveBeenCalled()
  })
})

// ── Flujo de confirmación ────────────────────────────────────────────────────

describe('confirmación', () => {
  it('llama onConfirm al hacer click en el botón de confirmar', () => {
    render(<ConfirmClockOutModal {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /finalizar jornada/i }))
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1)
    expect(baseProps.onClose).not.toHaveBeenCalled()
  })
})

// ── Estado de carga (loading) ────────────────────────────────────────────────

describe('estado loading', () => {
  it('deshabilita el botón confirmar mientras loading=true', () => {
    render(<ConfirmClockOutModal {...baseProps} loading={true} />)
    expect(screen.getByRole('button', { name: /finalizando/i })).toBeDisabled()
  })

  it('deshabilita el botón cancelar mientras loading=true (previene doble acción)', () => {
    render(<ConfirmClockOutModal {...baseProps} loading={true} />)
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeDisabled()
  })

  it('muestra texto de carga en el botón confirmar mientras loading=true', () => {
    render(<ConfirmClockOutModal {...baseProps} loading={true} />)
    expect(screen.getByRole('button', { name: /finalizando/i })).toBeInTheDocument()
  })
})
