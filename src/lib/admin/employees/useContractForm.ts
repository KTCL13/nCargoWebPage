import { useState } from 'react'
import { Employee } from '@/types/admin/employees'
import { authFetch } from '@/lib/api-client/auth-fetch'

export function useContractForm(fetchEmployees: () => void) {
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [contractModalEmpId, setContractModalEmpId] = useState<number | null>(null)
  const [contractModalEmpName, setContractModalEmpName] = useState('')
  const [contractModalLoading, setContractModalLoading] = useState(false)
  const [contractModalError, setContractModalError] = useState('')
  const [contractForm, setContractForm] = useState({
    jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '',
  })

  const openContractModal = (emp: Employee) => {
    setContractModalEmpId(emp.id)
    setContractModalEmpName(emp.name)
    setContractForm({ jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '' })
    setContractModalError('')
    setContractModalOpen(true)
  }

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contractModalEmpId) return
    setContractModalLoading(true)
    setContractModalError('')
    try {
      const res = await authFetch(`/api/employees/contracts?employeeId=${contractModalEmpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: Number(contractForm.jobId),
          contractTypeId: Number(contractForm.contractTypeId),
          salary: contractForm.salary ? Number(contractForm.salary) : 0,
          hourlyRate: contractForm.hourlyRate ? Number(contractForm.hourlyRate) : 0,
          startDate: contractForm.startDate,
          ...(contractForm.endDate && { endDate: contractForm.endDate }),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Error creando contrato')
      }
      setContractModalOpen(false)
      fetchEmployees()
    } catch (err) {
      setContractModalError(err instanceof Error ? err.message : 'Error al crear contrato')
    } finally {
      setContractModalLoading(false)
    }
  }

  return {
    contractModalOpen, setContractModalOpen, contractModalEmpName, contractModalLoading,
    contractModalError, contractForm, setContractForm, openContractModal, handleContractSubmit
  }
}
