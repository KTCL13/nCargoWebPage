export const contractsClient = {
  async getContracts(page: number, limit: number, search: string) {
    const params = new URLSearchParams({ page: String(page + 1), limit: String(limit), ...(search && { search }) })
    const res = await fetch(`/api/contracts?${params}`)
    if (!res.ok) throw new Error('Error fetching contracts')
    return res.json()
  },
  
  async updateContract(id: number, data: Partial<{ isActive: boolean, salary: number, hourlyRate: number, endDate: string }>) {
    const res = await fetch(`/api/contracts?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Error updating contract')
    return res.json()
  },
  
  async getEmployeeContractsHistory(empId: number) {
    const res = await fetch(`/api/employees/contracts?employeeId=${empId}`)
    if (!res.ok) throw new Error('Error fetching history')
    return res.json()
  }
}
