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
        <form onSubmit={handleContractSubmit} className="px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo / Puesto</label>
              <select
                required
                value={contractForm.jobId}
                onChange={e => setContractForm((f: any) => ({ ...f, jobId: e.target.value }))}
                className="form-input bg-white"
              >
                <option value="">Seleccionar cargo...</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de contrato</label>
              <select
                required
                value={contractForm.contractTypeId}
                onChange={e => setContractForm((f: any) => ({ ...f, contractTypeId: e.target.value }))}
                className="form-input bg-white"
              >
                <option value="">Seleccionar tipo...</option>
                {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                {isHourlyContractType(contractForm.contractTypeId) ? 'Tarifa por hora ($)' : 'Salario mensual ($)'}
              </label>
              <input
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
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio</label>
              <input
                type="date" required
                value={contractForm.startDate}
                onChange={e => setContractForm((f: any) => ({ ...f, startDate: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>
          {contractModalError && <p className="text-red-600 text-xs bg-red-50 p-3 rounded-[var(--radius-lg)] border border-red-100 font-medium">⚠️ {contractModalError}</p>}
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
              disabled={contractModalLoading}
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
