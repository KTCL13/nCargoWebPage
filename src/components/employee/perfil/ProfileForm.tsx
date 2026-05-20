import { ProfileData, ProfileFormData } from '@/lib/employee/perfil/types'

interface ProfileFormProps {
  editing: boolean
  formData: ProfileFormData
  setFormData: (data: ProfileFormData) => void
  profile: ProfileData | null
  jobTitle: string
  saving: boolean
  onSave: (e: React.FormEvent) => void
}

export function ProfileForm({
  editing, formData, setFormData, profile, jobTitle, saving, onSave
}: ProfileFormProps) {
  return (
    <form onSubmit={onSave} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-black/5">
        <h4 className="font-titles text-lg font-bold text-[var(--color-nc-dark)]">
          Información Personal y Laboral
        </h4>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Nombre(s)
          </label>
          <input
            type="text"
            disabled={!editing}
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Apellido(s)
          </label>
          <input
            type="text"
            disabled={!editing}
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Email
          </label>
          <input
            type="email"
            disabled
            value={profile?.email || ''}
            className="form-input bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Zona Horaria
          </label>
          <select
            disabled={!editing}
            value={formData.timezone}
            onChange={e => setFormData({ ...formData, timezone: e.target.value })}
            className="form-input disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="America/Bogota">Bogotá (GMT-5)</option>
            <option value="America/Miami">Miami (GMT-5/4)</option>
            <option value="America/New_York">New York (GMT-5/4)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {profile?.identificationType?.name || 'Identificación'}
          </label>
          <input
            type="text"
            disabled
            value={profile?.identificationNumber || ''}
            className="form-input bg-gray-50 text-gray-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Cargo Actual
          </label>
          <input
            type="text"
            disabled
            value={jobTitle}
            className="form-input bg-gray-50 text-gray-500"
          />
        </div>
      </div>
      {editing && (
        <div className="p-6 bg-gray-50 border-t border-black/5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      )}
    </form>
  )
}
