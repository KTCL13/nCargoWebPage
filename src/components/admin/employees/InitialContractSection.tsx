import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Job, ContractType, EmployeeFormState } from '@/types/admin/employees'
import { JobSearch } from '@/components/ui/JobSearch'

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** Earliest allowed start: 1 month (30 days) before today */
function getMinAllowedStart(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return toDateStr(d)
}

/** Latest allowed end: 1 year (365 days) after today */
function getMaxAllowedEnd(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return toDateStr(d)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const isHourlyContract = (typeId: string | number, contractTypes: ContractType[]) => {
  if (!typeId) return false
  const type = contractTypes.find(ct => String(ct.id) === String(typeId))
  return type?.name?.toUpperCase().includes('HORA') ?? false
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface InitialContractSectionProps {
  form: EmployeeFormState
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>
  jobs: Job[]
  contractTypes: ContractType[]
  isViewOnly?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InitialContractSection({
  form,
  setForm,
  jobs,
  contractTypes,
  isViewOnly,
}: InitialContractSectionProps) {
  const safeJobs = Array.isArray(jobs) ? jobs : []
  const isHourly = isHourlyContract(form.contractTypeId, contractTypes)

  // Dynamic date bounds
  const minAllowedStart = getMinAllowedStart()
  const maxAllowedEnd   = getMaxAllowedEnd()

  // Reactive validation rules (only evaluate when a value is present)
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

  const inputBase = 'form-input disabled:bg-gray-50 disabled:text-gray-500 transition-colors'
  const errorBorder = 'border-red-500 focus:border-red-600 focus:ring-red-100'

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
      <div>
        <h3 className="font-titles text-base font-bold text-[var(--color-foreground)]">Contrato Inicial</h3>
        <p className="font-subtitles text-xs text-gray-500 mt-0.5">Asignar puesto y remuneración inicial al nuevo empleado</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Cargo / Puesto */}
        <div className="col-span-2 sm:col-span-1">
          {isViewOnly ? (
            <div>
              <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo / Puesto</label>
              <div className={`${inputBase} bg-gray-50 text-gray-700`}>
                {safeJobs.find(j => String(j.id) === String(form.jobId))?.title || 'Sin cargo asignado'}
              </div>
            </div>
          ) : (
            <JobSearch
              label="Cargo / Puesto"
              value={form.jobId ? (safeJobs.find(j => String(j.id) === String(form.jobId)) ?? null) : null}
              onChange={job => setForm(f => ({ ...f, jobId: job ? String(job.id) : '' }))}
              placeholder="Buscar cargo o puesto..."
              error={!form.jobId ? undefined : undefined}
            />
          )}
        </div>

        {/* Tipo de contrato */}
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-contractTypeId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Tipo de contrato
          </label>
          <select
            id="initial-contractTypeId"
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
          <label htmlFor="initial-salaryRate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            {isHourly ? 'Tarifa por hora ($)' : 'Salario mensual ($)'}
          </label>
          <input
            id="initial-salaryRate"
            type="number" required step="0.01" placeholder="0.00"
            min="0.01"
            max={isHourly ? '99999999.99' : '9999999999.99'}
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
          <label htmlFor="initial-startDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Fecha de inicio
          </label>
          <input
            id="initial-startDate"
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
          <label htmlFor="initial-endDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            Fecha de fin (Opcional)
          </label>
          <input
            id="initial-endDate"
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

      {/* Error banner — only shown when a rule is violated */}
      {dateError && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-[var(--radius-md)] border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-[11px] font-bold leading-tight">{dateError}</p>
        </div>
      )}
    </div>
  )
}
