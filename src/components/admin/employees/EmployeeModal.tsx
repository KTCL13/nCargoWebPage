import { useState } from 'react'
import { Role, IdentificationType, ContractType, Job, EmployeeFormState } from '@/types/admin/employees'
import { passwordStrength } from '@/lib/admin/employees/utils'
import { ContractFormFields } from './ContractFormFields'
import { AdminModal } from './AdminModal'

interface EmployeeModalProps {
  showModal: boolean
  setShowModal: (show: boolean) => void
  isViewOnly: boolean
  editingId: number | null
  form: EmployeeFormState
  setForm: React.Dispatch<React.SetStateAction<EmployeeFormState>>
  identificationTypes: IdentificationType[]
  roles: Role[]
  jobs: Job[]
  contractTypes: ContractType[]
  modalLoading: boolean
  modalError: string
  handleSubmit: (e: React.FormEvent) => void
  dupWarning: { message: string } | null
  setDupWarning: (warning: { message: string } | null) => void
  setSkipDupCheck: (skip: boolean) => void
}

export function EmployeeModal({
  showModal, setShowModal, isViewOnly, editingId, form, setForm,
  identificationTypes, roles, jobs, contractTypes, modalLoading, modalError, handleSubmit,
  dupWarning, setDupWarning, setSkipDupCheck
}: EmployeeModalProps) {
  const [showPassword, setShowPassword] = useState(false)

  const title = isViewOnly ? 'Detalles del Empleado' : editingId ? 'Editar Empleado' : 'Añadir Empleado'
  const description = isViewOnly 
    ? `Viendo perfil de ${form.firstName} ${form.lastName}` 
    : editingId 
      ? `Modificando a ${form.firstName} ${form.lastName}` 
      : 'Completa los datos con asterisco (*) para continuar'

  const onClose = () => {
    setShowModal(false)
    setDupWarning(null)
    setSkipDupCheck(false)
  }

  return (
    <AdminModal
      isOpen={showModal}
      onClose={onClose}
      title={title}
      description={description}
      error={modalError}
      loading={modalLoading}
      hideFooter={isViewOnly}
      submitText={editingId ? 'Actualizar empleado' : 'Registrar empleado'}
      onSubmit={handleSubmit}
    >
      {/* Employee section */}
      <div>
        <p className="font-subtitles text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
          Datos del empleado
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-1">
            <label htmlFor="firstName" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              id="firstName" name="firstName" type="text" required placeholder="Ej: Carlos" disabled={isViewOnly}
              value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
              className="form-input disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div className="sm:col-span-1">
            <label htmlFor="lastName" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Apellido <span className="text-red-500">*</span></label>
            <input
              id="lastName" name="lastName" type="text" required placeholder="Ej: Pérez" disabled={isViewOnly}
              value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
              className="form-input disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label htmlFor="identificationTypeId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de identificación <span className="text-red-500">*</span></label>
            <select
              id="identificationTypeId" name="identificationTypeId" required disabled={isViewOnly}
              value={form.identificationTypeId} onChange={e => setForm(f => ({ ...f, identificationTypeId: e.target.value }))}
              className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Seleccionar...</option>
              {identificationTypes.map(it => <option key={it.id} value={it.id}>{it.code} — {it.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="identificationNumber" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Número de identificación <span className="text-red-500">*</span></label>
            <input
              id="identificationNumber" name="identificationNumber" type="text" required placeholder="Ej: 1234567890" disabled={isViewOnly}
              value={form.identificationNumber} onChange={e => setForm(f => ({ ...f, identificationNumber: e.target.value }))}
              className="form-input disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
            <input
              id="email" name="email" type="email" required placeholder="usuario@dominio.com" disabled={isViewOnly}
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="form-input disabled:bg-gray-50 disabled:text-gray-500"
              pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
              title="Formato requerido válido: usuario@dominio.com"
            />
          </div>
          <div>
            <label htmlFor="phoneCode" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Teléfono <span className="text-red-500">*</span></label>
            <div className="flex border border-gray-200 rounded-[var(--radius-lg)] overflow-hidden focus-within:border-[var(--color-primary)]">
              <select
                id="phoneCode" name="phoneCode" aria-label="Código de país" disabled={isViewOnly}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="bg-gray-50 px-2 text-sm outline-none disabled:opacity-50"
              >
                <option value="+57 ">🇨🇴 +57</option><option value="+1 ">🇺🇸 +1</option><option value="+34 ">🇪🇸 +34</option><option value="+52 ">🇲🇽 +52</option>
              </select>
              <input
                id="phoneNumber" name="phoneNumber" aria-label="Número de teléfono" type="text" placeholder="000 000 0000" disabled={isViewOnly}
                value={form.phone.replace(/^\+\d+\s?/, '')}
                onChange={e => setForm(f => ({ ...f, phone: (f.phone.match(/^\+\d+\s?/) || [''])[0] + e.target.value }))}
                className="w-full px-3 py-2.5 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="password" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
              Contraseña {editingId ? <span className="text-gray-600 font-normal">(dejar en blanco para no cambiar)</span> : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'} required={!editingId} placeholder="••••••••" disabled={isViewOnly}
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="form-input pr-10 disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!isViewOnly && (
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-600 transition">
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              )}
            </div>
            {form.password && !isViewOnly && (
              <div className="mt-3 p-3 bg-gray-50 rounded-[var(--radius-lg)] border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Seguridad:</span>
                  <span className={`text-[10px] font-bold uppercase ${passwordStrength(form.password).text}`}>{passwordStrength(form.password).label}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-full flex-1 transition-all duration-500 ${i <= passwordStrength(form.password).score ? passwordStrength(form.password).color : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="roleId" className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de trabajador <span className="text-red-500">*</span></label>
            <select
              id="roleId" name="roleId" required disabled={isViewOnly}
              value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
              className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Seleccionar...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name === 'ADMIN' ? 'Administrador' : r.name === 'EMPLOYEE' ? 'Empleado' : r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {(!editingId || isViewOnly) && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-4">
          <div>
            <h3 className="font-titles text-base font-bold text-[var(--color-foreground)]">Contrato Inicial</h3>
            <p className="font-subtitles text-xs text-gray-500 mt-0.5">Asignar puesto y remuneración inicial al nuevo empleado</p>
          </div>
          <ContractFormFields
            form={form}
            setForm={setForm}
            jobs={jobs}
            contractTypes={contractTypes}
            isViewOnly={isViewOnly}
            idPrefix="initial-"
          />
        </div>
      )}

      {dupWarning && (
        <div className="bg-orange-50 border border-orange-100 p-3 rounded-[var(--radius-lg)]">
          <p className="text-orange-700 text-xs font-medium mb-2">⚠️ {dupWarning.message}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setSkipDupCheck(true); setDupWarning(null); }} className="bg-orange-600 text-white text-[10px] px-3 py-1 rounded font-bold hover:bg-orange-700">
              SÍ, CONTINUAR
            </button>
            <button type="button" onClick={() => setDupWarning(null)} className="bg-white text-orange-600 border border-orange-200 text-[10px] px-3 py-1 rounded font-bold hover:bg-orange-50">
              CANCELAR
            </button>
          </div>
        </div>
      )}
    </AdminModal>
  )
}
