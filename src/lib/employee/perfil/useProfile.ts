import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ProfileData, ProfileFormData } from './types'

export function useProfile() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
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

  return {
    profile, loading, editing, setEditing, saving, error,
    formData, setFormData, fetchProfile, handleSave, jobTitle
  }
}
