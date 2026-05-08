'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useAuth } from '@/context/AuthContext'

interface ProfileData {
  id: number
  firstName: string
  lastName: string
  email: string
  identificationNumber: string
  timezone: string
  identificationType: {
    id: number
    name: string
  }
  contracts?: Array<{
    id: number
    isActive: boolean
    job: {
      title: string
    }
  }>
}

export default function ProfilePage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    timezone: ''
  })

  const fetchProfile = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      const res = await fetch('/api/employee/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error al cargar el perfil')
      const data = await res.json()
      setProfile(data)
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        timezone: data.timezone
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      setSaving(true)
      const res = await fetch('/api/employee/me', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      if (!res.ok) throw new Error('Error al actualizar el perfil')
      await fetchProfile()
      setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const jobTitle = profile?.contracts?.[0]?.job?.title || 'Sin cargo asignado'

  return (
    <DashboardLayout
      pageTitle="Mi Perfil"
      navItems={NAV_ITEMS}
      onReload={fetchProfile}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-titles text-2xl font-extrabold text-[var(--color-nc-dark)]">
            Mi Perfil
          </h2>
          <button
            onClick={() => setEditing(!editing)}
            className={`btn-${editing ? 'outline' : 'primary'} text-sm`}
          >
            {editing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar Profile Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-nc-blue)] to-[var(--color-nc-red)] rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </div>
                <h3 className="mt-4 font-titles text-xl font-bold text-[var(--color-nc-dark)]">
                  {profile?.firstName} {profile?.lastName}
                </h3>
                <p className="text-sm font-subtitles text-[var(--color-nc-dark)]/50">
                  {jobTitle}
                </p>
                <div className="mt-6 pt-6 border-t border-black/5 flex flex-col gap-2">
                   <div className="flex justify-between text-xs font-subtitles">
                      <span className="text-[var(--color-nc-dark)]/40 uppercase tracking-widest">ID</span>
                      <span className="font-bold">{profile?.id}</span>
                   </div>
                   <div className="flex justify-between text-xs font-subtitles">
                      <span className="text-[var(--color-nc-dark)]/40 uppercase tracking-widest">Status</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase text-[9px]">Activo</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2 space-y-6">
              <form onSubmit={handleSave} className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
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

              <div className="bg-[var(--color-nc-dark)] rounded-2xl p-6 text-white">
                <h4 className="font-titles text-lg font-bold mb-2">Seguridad</h4>
                <p className="font-subtitles text-sm text-white/60 mb-4">
                  Si necesitas cambiar tu contraseña o actualizar tu documento de identidad, por favor contacta al departamento de RRHH.
                </p>
                <div className="flex gap-4">
                  <button className="text-xs font-bold uppercase tracking-widest text-[var(--color-nc-red)] hover:text-white transition-colors">
                    Solicitar Cambio
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
