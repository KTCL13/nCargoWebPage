export type IdentificationType = { id: number; code: string; name: string }

export type Employee = {
  id: number
  firstName: string
  lastName: string
  name: string
  identificationNumber: string
  identificationType: IdentificationType
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  roles: string[]
  activeContract: { id: number; job: { title: string } } | null
  createdAt: string
  metadata?: {
    phone?: string
  }
}

export type Role = { id: number; name: string }
export type Job = { id: number; title: string }
export type ContractType = { id: number; name: string }

export type EmployeeFormState = {
  firstName: string
  lastName: string
  identificationNumber: string
  identificationTypeId: string
  email: string
  password: string
  phone: string
  roleId: string
  status: 'ACTIVE' | 'INACTIVE'
  jobId: string
  contractTypeId: string
  salary: string
  hourlyRate: string
  startDate: string
  endDate: string
}
