import { useState } from 'react'
import { EmployeeFormState } from '@/types/admin/employees'
import { passwordStrength } from '@/lib/admin/employees/utils'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useEmployeeSubmit(
  form: EmployeeFormState, editingId: number | null, 
  setModalError: (s: string) => void, setModalLoading: (b: boolean) => void,
  setShowModal: (b: boolean) => void, fetchEmployees: () => void
) {
  const [dupWarning, setDupWarning] = useState<{ message: string } | null>(null)
  const [skipDupCheck, setSkipDupCheck] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setModalError('')
    if (form.password && !passwordStrength(form.password).isValid) return setModalError('La contraseña no cumple seguridad')

    if (!skipDupCheck) {
      const phone = form.phone.replace(/\s/g, ''); const params = new URLSearchParams()
      if (form.email) params.set('email', form.email)
      if (phone) params.set('phone', phone)
      if (editingId) params.set('excludeId', String(editingId))
      try {
        const res = await authFetch(`/api/employees/check-duplicate?${params}`)
        if (res.ok) {
          const { emailOwner, phoneOwner } = await res.json(); const parts = []
          if (emailOwner) parts.push(`el correo pertenece a ${emailOwner}`)
          if (phoneOwner) parts.push(`el teléfono pertenece a ${phoneOwner}`)
          if (parts.length > 0) return setDupWarning({ message: `¿Seguro? ${parts.join(' y ')}.` })
        }
      } catch { /* proceed */ }
    }

    setSkipDupCheck(false); setDupWarning(null); setModalLoading(true)
    try {
      const isEditing = editingId !== null; const url = isEditing ? `/api/employees?id=${editingId}` : '/api/employees'
      const body: any = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), identificationNumber: form.identificationNumber.trim(), identificationTypeId: Number(form.identificationTypeId), email: form.email, status: form.status, roleIds: [Number(form.roleId)], metadata: { phone: form.phone } }
      if (!isEditing || form.password) body.password = form.password
      if (!isEditing && form.jobId && form.contractTypeId) {
        body.initialContract = { jobId: Number(form.jobId), contractTypeId: Number(form.contractTypeId), salary: Number(form.salary) || 0, hourlyRate: Number(form.hourlyRate) || 0, startDate: form.startDate, ...(form.endDate && { endDate: form.endDate }) }
      }
      const res = await authFetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).message || 'Error en operación')
      setShowModal(false); fetchEmployees()
    } catch (err: any) { setModalError(err.message || 'Error') } finally { setModalLoading(false) }
  }

  return { dupWarning, setDupWarning, skipDupCheck, setSkipDupCheck, handleSubmit }
}
