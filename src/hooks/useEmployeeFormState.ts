import { useState } from 'react'
import { EmployeeFormState } from '@/types/admin/employees'

export function useEmployeeFormState() {
  const [form, setForm] = useState<EmployeeFormState>({
    firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
    email: '', password: '', phone: '',
    roleId: '', status: 'ACTIVE',
    jobId: '', contractTypeId: '',
    salary: '', hourlyRate: '', startDate: '', endDate: '',
  })

  return { form, setForm }
}
