import { Job, ContractType, EmployeeFormState } from '@/types/admin/employees'

export const isHourlyContract = (typeId: string | number, contractTypes: ContractType[]) => {
  if (!typeId) return false
  const type = contractTypes.find(ct => String(ct.id) === String(typeId))
  return type?.name?.toUpperCase().includes('HORA') ?? false
}

interface InitialContractSectionProps {
  form: EmployeeFormState
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>
  jobs: Job[]
  contractTypes: ContractType[]
  isViewOnly?: boolean
}

export function InitialContractSection({
  form,
  setForm,
  jobs,
  contractTypes,
  isViewOnly
}: InitialContractSectionProps) {
  const safeJobs = Array.isArray(jobs) ? jobs : []
  const isHourly = isHourlyContract(form.contractTypeId, contractTypes)

  return (
    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
      <div>
        <h3 className="font-titles text-base font-bold text-[var(--color-foreground)]">Contrato Inicial</h3>
        <p className="font-subtitles text-xs text-gray-500 mt-0.5">Asignar puesto y remuneración inicial al nuevo empleado</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-jobId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo / Puesto</label>
          <select
            id="initial-jobId"
            required
            disabled={isViewOnly}
            value={form.jobId}
            onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
            className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Seleccionar cargo...</option>
            {safeJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-contractTypeId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de contrato</label>
          <select
            id="initial-contractTypeId"
            required
            disabled={isViewOnly}
            value={form.contractTypeId}
            onChange={e => setForm(f => ({ ...f, contractTypeId: e.target.value }))}
            className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Seleccionar tipo...</option>
            {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-salaryRate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
            {isHourly ? 'Tarifa por hora ($)' : 'Salario mensual ($)'}
          </label>
          <input
            id="initial-salaryRate"
            type="number" required step="0.01" placeholder="0.00"
            disabled={isViewOnly}
            value={isHourly ? form.hourlyRate : form.salary}
            onChange={e => {
              const val = e.target.value
              if (isHourly) {
                setForm(f => ({ ...f, hourlyRate: val, salary: '' }))
              } else {
                setForm(f => ({ ...f, salary: val, hourlyRate: '' }))
              }
            }}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-startDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio</label>
          <input
            id="initial-startDate"
            type="date" required
            disabled={isViewOnly}
            value={form.startDate}
            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="initial-endDate" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de fin (Opcional)</label>
          <input
            id="initial-endDate"
            type="date"
            disabled={isViewOnly}
            value={form.endDate}
            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      </div>
    </div>
  )
}
