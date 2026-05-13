'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { useProfile } from '@/lib/employee/perfil/useProfile'
import { ProfileCard } from '@/components/employee/perfil/ProfileCard'
import { ProfileForm } from '@/components/employee/perfil/ProfileForm'
import { SecurityInfo } from '@/components/employee/perfil/SecurityInfo'

export function PerfilClient() {
  const {
    profile, loading, editing, setEditing, saving, error,
    formData, setFormData, fetchProfile, handleSave, jobTitle
  } = useProfile()

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
            aria-label={editing ? 'Cancelar edición' : 'Editar perfil'}
            className={`btn-${editing ? 'outline' : 'primary'} text-sm`}
          >
            {editing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Cargando perfil">
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-6">
              <ProfileCard profile={profile} jobTitle={jobTitle} />
            </div>

            <div className="md:col-span-2 space-y-6">
              <ProfileForm
                editing={editing}
                formData={formData}
                setFormData={setFormData}
                profile={profile}
                jobTitle={jobTitle}
                saving={saving}
                onSave={handleSave}
              />
              <SecurityInfo />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
