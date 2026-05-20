import { useState } from 'react'
import { Employee, Role, EmployeeFormState } from '@/types/admin/employees'

export function useEmployeeModal(roles: Role[], setForm: (f: EmployeeFormState) => void, setDupWarning: (w: any) => void, setSkipDupCheck: (b: boolean) => void) {
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)

  const openModal = async (emp?: Employee, view = false) => {
    setShowModal(true); setModalError(''); setEditingId(emp?.id ?? null); setIsViewOnly(view)
    setDupWarning(null); setSkipDupCheck(false)
    const empty: EmployeeFormState = { firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '', email: '', password: '', phone: '', roleId: '', status: 'ACTIVE', jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '' }
    setForm(empty)
    if (emp) {
      setModalLoading(true)
      try {
        const res = await fetch(`/api/employees?id=${emp.id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const roleId = roles.find(r => r.name === data.roles?.[0])?.id?.toString() || ''
        setForm({
          ...empty, firstName: data.firstName || '', lastName: data.lastName || '', identificationNumber: data.identificationNumber || '', identificationTypeId: data.identificationType?.id?.toString() || '', email: data.email || '', status: data.status || 'ACTIVE', phone: data.metadata?.phone || '', roleId, jobId: data.activeContract?.job?.id?.toString() || '', contractTypeId: data.activeContract?.contractType?.id?.toString() || '', salary: data.activeContract?.salary?.toString() || '', hourlyRate: data.activeContract?.hourlyRate?.toString() || '', startDate: data.activeContract?.startDate ? new Date(data.activeContract.startDate).toISOString().split('T')[0] : '', endDate: data.activeContract?.endDate ? new Date(data.activeContract.endDate).toISOString().split('T')[0] : ''
        })
      } catch { setModalError('Error al cargar') } finally { setModalLoading(false) }
    }
  }

  return { showModal, setShowModal, modalLoading, setModalLoading, modalError, setModalError, editingId, isViewOnly, openModal }
}
