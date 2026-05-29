import React, { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { Job, ContractType } from '@/types/admin/employees'

// ── Date helpers ──────────────────────────────────────────────────────────────

export function toDateStr(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

export function getMinAllowedStart(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return toDateStr(d)
}

export function getMaxAllowedEnd(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return toDateStr(d)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const isHourlyContract = (typeId: string | number | undefined, contractTypes: ContractType[]) => {
  if (!typeId) return false
  const type = contractTypes.find(ct => String(ct.id) === String(typeId))
  return type?.name?.toUpperCase().includes('HORA') ?? false
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface BaseContractForm {
  jobId?: string | number
  contractTypeId?: string | number
  salary?: string | number
  hourlyRate?: string | number
  startDate?: string
  endDate?: string
}

export interface ContractFormFieldsProps<T extends BaseContractForm> {
  form: T
  setForm: React.Dispatch<React.SetStateAction<T>>
  jobs: Job[]
  contractTypes: ContractType[]
  isViewOnly?: boolean
  idPrefix?: string
  onValidationError?: (error: string | null) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContractFormFields<T extends BaseContractForm>({
  form,
  setForm,
  jobs,
  contractTypes,
  isViewOnly,
  idPrefix = 'contract-',
  onValidationError
}: ContractFormFieldsProps<T>) {
  const safeJobs = Array.isArray(jobs) ? jobs : []
  const isHourly = isHourlyContract(form.contractTypeId, contractTypes)

  // Dynamic date bounds
  const minAllowedStart = getMinAllowedStart()
  const maxAllowedEnd   = getMaxAllowedEnd()

  // Reactive validation rules
  const startTooEarly  = !!form.startDate && form.startDate < minAllowedStart
  const endBeforeStart = !!form.endDate && !!form.startDate && form.endDate < form.startDate
  const endTooLate     = !!form.endDate && form.endDate > maxAllowedEnd

  // Priority-ordered error message
  const dateError: string | null = startTooEarly
    ? 'La fecha de inicio no puede ser anterior a 1 mes atrás.'
    : endBeforeStart
    ? 'La fecha de fin no puede ser anterior a la de inicio.'
    : endTooLate
    ? 'La fecha de fin no puede superar 1 año desde la fecha actual.'
    : null

  // Report validation error upwards
  useEffect(() => {
    if (onValidationError) {
      onValidationError(dateError)
    }
  }, [dateError, onValidationError])

  const inputBase = 'form-input disabled:bg-gray-50 disabled:text-gray-500 transition-colors'
  const errorBorder = 'border-red-500 focus:border-red-600 focus:ring-red-100'

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {/* Cargo / Puesto */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${idPrefix}jobId`} className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Cargo / Puesto
          </label>
          <select
            id={`${idPrefix}jobId`}
            required
            disabled={isViewOnly}
            value={form.jobId || ''}
            onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
            className={`${inputBase} bg-white`}
          >
            <option value="">Seleccionar cargo...</option>
            {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        {/* Tipo de contrato */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${idPrefix}contractTypeId`} className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Tipo de contrato
          </label>
          <select
            id={`${idPrefix}contractTypeId`}
            required
            disabled={isViewOnly}
            value={form.contractTypeId || ''}
            onChange={e => setForm(f => ({ ...f, contractTypeId: e.target.value }))}
            className={`${inputBase} bg-white`}
          >
            <option value="">Seleccionar tipo...</option>
            {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
          </select>
        </div>

        {/* Salario / Tarifa */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${idPrefix}salaryRate`} className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            {isHourly ? (
              <>Tarifa por hora ($)<br />no puede ser menor al mínimo legal ($16/h)</>
            ) : (
              <>Salario mensual ($)<br />no puede ser menor al SMLV ($1.690)</>
            )}
          </label>
          <input
            id={`${idPrefix}salaryRate`}
            type="number" required step="0.01" placeholder="0.00"
            disabled={isViewOnly}
            value={isHourly ? (form.hourlyRate || '') : (form.salary || '')}
            onChange={e => {
              const val = e.target.value
              if (isHourly) {
                setForm(f => ({ ...f, hourlyRate: val, salary: '' }))
              } else {
                setForm(f => ({ ...f, salary: val, hourlyRate: '' }))
              }
            }}
            className={inputBase}
          />
        </div>

        {/* Fecha de Inicio */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${idPrefix}startDate`} className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Fecha de inicio
          </label>
          <input
            id={`${idPrefix}startDate`}
            type="date" required
            disabled={isViewOnly}
            value={form.startDate || ''}
            min={minAllowedStart}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className={`${inputBase} w-full ${startTooEarly ? errorBorder : ''}`}
          />
        </div>

        {/* Fecha de Fin */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor={`${idPrefix}endDate`} className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Fecha de fin (Opcional)
          </label>
          <input
            id={`${idPrefix}endDate`}
            type="date"
            disabled={isViewOnly}
            value={form.endDate || ''}
            min={form.startDate || minAllowedStart}
            max={maxAllowedEnd}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className={`${inputBase} w-full ${endBeforeStart || endTooLate ? errorBorder : ''}`}
          />
        </div>
      </div>

      {/* Error banner */}
      {dateError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-[var(--radius-md)] border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[11px] font-bold leading-tight">{dateError}</p>
        </div>
      )}
    </>
  )
}
