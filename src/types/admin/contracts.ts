export interface Contract {
  id: number
  salary: number | null
  hourlyRate: number | null
  startDate: string
  endDate: string | null
  isActive: boolean
  employee: { id: number; name: string; email: string }
  job: { id: number; title: string }
  contractType: { id: number; name: string }
}
