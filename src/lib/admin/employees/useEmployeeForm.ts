import { useState } from 'react'
import { Employee, Role, EmployeeFormState } from '@/types/admin/employees'
import { passwordStrength } from '@/lib/admin/employees/utils'

export function useEmployeeForm(roles: Role[], fetchEmployees: () => void) {
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [form, setForm] = useState<EmployeeFormState>({
    firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
    email: '', password: '', phone: '',
    roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    jobId: '', contractTypeId: '',
    salary: '', hourlyRate: '', startDate: '', endDate: '',
  })

  const [dupWarning, setDupWarning] = useState<{ message: string } | null>(null)
  const [skipDupCheck, setSkipDupCheck] = useState(false)

  const openModal = async (emp?: Employee, view = false) => {
    setShowModal(true)
    setModalError('')
    setDupWarning(null)
    setSkipDupCheck(false)
    setEditingId(emp?.id ?? null)
    setIsViewOnly(view)

    const emptyForm: EmployeeFormState = {
      firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
      email: '', password: '', phone: '',
      roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
      jobId: '', contractTypeId: '',
      salary: '', hourlyRate: '', startDate: '', endDate: '',
    }
    setForm(emptyForm)

    if (emp) {
      setModalLoading(true)
      try {
        const res = await fetch(`/api/employees?id=${emp.id}`)
        if (!res.ok) throw new Error('Error al cargar datos')
        const fullData = await res.json()

        const roleId = roles.find((role: Role) => role.name === fullData.roles?.[0])?.id?.toString() || ''

        setForm({
          ...emptyForm,
          firstName: fullData.firstName || '',
          lastName: fullData.lastName || '',
          identificationNumber: fullData.identificationNumber || '',
          identificationTypeId: fullData.identificationType?.id?.toString() || '',
          email: fullData.email || '',
          status: fullData.status || 'ACTIVE',
          phone: fullData.metadata?.phone || '',
          roleId,
          jobId: fullData.activeContract?.job?.id?.toString() || '',
          contractTypeId: fullData.activeContract?.contractType?.id?.toString() || '',
          salary: fullData.activeContract?.salary?.toString() || '',
          hourlyRate: fullData.activeContract?.hourlyRate?.toString() || '',
          startDate: fullData.activeContract?.startDate ? new Date(fullData.activeContract.startDate).toISOString().split('T')[0] : '',
          endDate: fullData.activeContract?.endDate ? new Date(fullData.activeContract.endDate).toISOString().split('T')[0] : '',
        })
      } catch (err) {
        setModalError('No se pudieron cargar los datos completos del empleado')
      } finally {
        setModalLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError('')

    if (form.password) {
      const { isValid } = passwordStrength(form.password)
      if (!isValid) {
        setModalError('La contraseña no cumple los requisitos mínimos de seguridad')
        return
      }
    }

    if (!skipDupCheck) {
      const phone = form.phone.replace(/\s/g, '')
      const params = new URLSearchParams()
      if (form.email) params.set('email', form.email)
      if (phone) params.set('phone', phone)
      if (editingId) params.set('excludeId', String(editingId))

      try {
        const checkRes = await fetch(`/api/employees/check-duplicate?${params}`)
        if (checkRes.ok) {
          const { emailOwner, phoneOwner } = await checkRes.json()
          const parts: string[] = []
          if (emailOwner) parts.push(`el correo ya pertenece a ${emailOwner}`)
          if (phoneOwner) parts.push(`el teléfono ya pertenece a ${phoneOwner}`)
          if (parts.length > 0) {
            setDupWarning({ message: `¿Seguro que quieres guardar? ${parts.join(' y ')}. ¿Continuar de todas formas?` })
            return
          }
        }
      } catch { /* proceed */ }
    }

    setSkipDupCheck(false)
    setDupWarning(null)
    setModalLoading(true)
    try {
      const isEditing = editingId !== null
      const url = isEditing ? `/api/employees?id=${editingId}` : '/api/employees'
      const method = isEditing ? 'PUT' : 'POST'

      const body: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        identificationNumber: form.identificationNumber.trim(),
        identificationTypeId: Number(form.identificationTypeId),
        email: form.email,
        status: form.status,
        roleIds: [Number(form.roleId)],
        metadata: { phone: form.phone },
      }

      if (!isEditing || form.password) {
        body.password = form.password
      }

      if (!isEditing && form.jobId && form.contractTypeId) {
        body.initialContract = {
          jobId: Number(form.jobId),
          contractTypeId: Number(form.contractTypeId),
          salary: form.salary ? Number(form.salary) : 0,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 0,
          startDate: form.startDate,
          ...(form.endDate && { endDate: form.endDate }),
        }
      }

      const empRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const empData = await empRes.json()
      if (!empRes.ok) throw new Error(empData.message || 'Error en la operación')

      setShowModal(false)
      fetchEmployees()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al guardar empleado')
    } finally {
      setModalLoading(false)
    }
  }

  return {
    showModal, setShowModal, modalLoading, modalError, editingId, isViewOnly, form, setForm,
    dupWarning, setDupWarning, setSkipDupCheck, openModal, handleSubmit
  }
}
