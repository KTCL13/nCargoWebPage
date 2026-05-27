import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Job, ContractType } from '@/types/admin/employees'

interface ContractModalProps {
  contractModalOpen: boolean
  setContractModalOpen: (open: boolean) => void
  contractModalEmpName: string
  contractForm: any
  setContractForm: (form: any) => void
  jobs: Job[]
  contractTypes: ContractType[]
  contractModalLoading: boolean
  contractModalError: string
  handleContractSubmit: (e: React.FormEvent) => void
}

/** Formatea una fecha a String local YYYY-MM-DD para inputs nativos */
function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Retorna la fecha mínima permitida (1 mes en el pasado desde hoy) */
function getMinStartDate(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return toDateString(d)
}

/** Retorna la fecha máxima permitida para el fin (1 año en el futuro desde hoy) */
function getMaxEndDate(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return toDateString(d)
}

export function ContractModal({
  contractModalOpen, setContractModalOpen, contractModalEmpName,
  contractForm, setContractForm, jobs, contractTypes,
  contractModalLoading, contractModalError, handleContractSubmit
}: ContractModalProps) {

  if (!contractModalOpen) return null

  const isHourlyContractType = (typeId: string | number) => {
    if (!typeId) return false
    const type = contractTypes.find(ct => String(ct.id) === String(typeId))
    return type?.name?.toUpperCase().includes('HORA') ?? false
  }

  const safeJobs: Job[] = Array.isArray(jobs) ? jobs : []

  // 1. Cálculos de fechas límites dinámicas
  const minAllowedStart = getMinStartDate()
  const maxAllowedEnd = getMaxEndDate()

  // 2. Evaluadores lógicos de las 3 reglas
  const startTooEarly = contractForm.startDate && contractForm.startDate < minAllowedStart
  const endBeforeStart = contractForm.endDate && contractForm.startDate && contractForm.endDate < contractForm.startDate
  const endTooLate = contractForm.endDate && contractForm.endDate > maxAllowedEnd

  // 3. Determinar el mensaje de error prioritario
  const dateValidationError = startTooEarly
    ? 'La fecha de inicio no puede ser anterior a 1 mes atrás.'
    : endBeforeStart
      ? 'La fecha de fin no puede ser anterior a la de inicio.'
      : endTooLate
        ? 'La fecha de fin no puede superar 1 año desde la fecha actual.'
        : null

  // 4. Interceptor del submit
  const onFormSubmit = (e: React.FormEvent) => {
    if (dateValidationError) {
      e.preventDefault()
      return
    }
    handleContractSubmit(e)
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-lg">

        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">Nuevo Contrato</h2>
            <p className="font-subtitles text-sm text-gray-500 mt-0.5">Asignar cargo y salario a {contractModalEmpName}</p>
          </div>
          <button onClick={() => setContractModalOpen(false)} className="text-gray-600 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={onFormSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">

            {/* Cargo / Puesto */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="jobId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo / Puesto</label>
              <select
                id="jobId"
                name="jobId"
                required
                value={contractForm.jobId}
                onChange={e => setContractForm((f: any) => ({ ...f, jobId: e.target.value }))}
                className="form-input bg-white"
              >
                <option value="">Seleccionar cargo...</option>
                {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            {/* Tipo de contrato */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="contractTypeId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de contrato</label>
              <select
                id="contractTypeId"
                name="contractTypeId"
                required
                value={contractForm.contractTypeId}
                onChange={e => setContractForm((f: any) => ({ ...f, contractTypeId: e.target.value }))}
                className="form-input bg-white"
              >
                <option value="">Seleccionar tipo...</option>
                {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>

            {/* Salario / Tarifa */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="salaryRate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                {isHourlyContractType(contractForm.contractTypeId) ? 'Tarifa por hora ($)' : 'Salario mensual ($)'}
              </label>
              <input
                id="salaryRate"
                name="salaryRate"
                type="number" required step="0.01" placeholder="0.00"
                value={isHourlyContractType(contractForm.contractTypeId) ? contractForm.hourlyRate : contractForm.salary}
                onChange={e => {
                  const val = e.target.value
                  if (isHourlyContractType(contractForm.contractTypeId)) {
                    setContractForm((f: any) => ({ ...f, hourlyRate: val, salary: '' }))
                  } else {
                    setContractForm((f: any) => ({ ...f, salary: val, hourlyRate: '' }))
                  }
                }}
                className="form-input"
              />
            </div>

            {/* Fecha de Inicio */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="startDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio</label>
              <input
                id="startDate"
                name="startDate"
                type="date" required
                value={contractForm.startDate || ''}
                min={minAllowedStart}
                onChange={e => setContractForm((f: any) => ({ ...f, startDate: e.target.value }))}
                className={`form-input w-full transition-colors ${startTooEarly ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''
                  }`}
              />
            </div>

            {/* Fecha de Fin (Opcional) */}
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="endDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de fin (Opcional)</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={contractForm.endDate || ''}
                min={contractForm.startDate || minAllowedStart}
                max={maxAllowedEnd}
                onChange={e => setContractForm((f: any) => ({ ...f, endDate: e.target.value }))}
                className={`form-input w-full transition-colors ${endBeforeStart || endTooLate ? 'border-red-500 focus:border-red-600 focus:ring-red-100' : ''
                  }`}
              />
            </div>
          </div>

          {/* Banner de errores de validación de fechas */}
          {dateValidationError && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2.5 rounded-[var(--radius-md)] border border-red-100 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="shrink-0" />
              <p className="text-[11px] font-bold leading-tight">{dateValidationError}</p>
            </div>
          )}

          {/* Errores externos del backend */}
          {contractModalError && (
            <p className="text-red-600 text-xs bg-red-50 p-3 rounded-[var(--radius-lg)] border border-red-100 font-medium">
              ⚠️ {contractModalError}
            </p>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setContractModalOpen(false)}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 rounded-[var(--radius-lg)] font-bold text-sm hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={contractModalLoading || !!dateValidationError}
              className="flex-[2] px-4 py-3 bg-green-600 text-white rounded-[var(--radius-lg)] font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {contractModalLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Crear Contrato
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
