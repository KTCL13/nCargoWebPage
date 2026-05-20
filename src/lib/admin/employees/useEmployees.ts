import { useState, useCallback, useEffect } from 'react'
import { Employee, Role, Job, ContractType, IdentificationType } from '@/types/admin/employees'
import { authFetch } from '@/lib/api-client/auth-fetch'

const DEFAULT_LIMIT = 10

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')

  // Dirty rows: pending status changes not yet saved
  const [dirty, setDirty] = useState<Record<number, 'ACTIVE' | 'INACTIVE'>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState<Set<number>>(new Set())

  // Dependencies
  const [roles, setRoles] = useState<Role[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setDirty({})
    setSelected(new Set())
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(search && { search }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterRole && { roleId: filterRole }),
      })
      const res = await authFetch(`/api/employees?${params}`)
      const data = await res.json()
      setEmployees(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterStatus, filterRole])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  useEffect(() => {
    Promise.all([
      authFetch('/api/roles').then(x => x.json()),
      authFetch('/api/jobs').then(x => x.json()),
      authFetch('/api/contract-types').then(x => x.json()),
      authFetch('/api/identification-types').then(x => x.json()),
    ]).then(([r, j, ct, it]) => {
      setRoles(r)
      setJobs(j.data ?? [])
      setContractTypes(ct)
      setIdentificationTypes(it)
    }).catch(err => console.error('Error fetching dependencies:', err))
  }, [])

  const toggleStatus = (id: number, current: 'ACTIVE' | 'INACTIVE') => {
    const currentStatus = dirty[id] ?? current
    setDirty(d => ({ ...d, [id]: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }))
  }

  const saveRow = async (id: number) => {
    const status = dirty[id]
    if (!status) return
    setSaving(s => new Set(s).add(id))
    try {
      await authFetch(`/api/employees?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setDirty(d => { const n = { ...d }; delete n[id]; return n })
      setEmployees(list => list.map(e => e.id === id ? { ...e, status } : e))
    } finally {
      setSaving(s => { const n = new Set(s); n.delete(id); return n })
    }
  }

  const saveAll = async () => {
    await Promise.all(Object.keys(dirty).map(id => saveRow(Number(id))))
  }

  const bulkUpdate = async (status: 'ACTIVE' | 'INACTIVE') => {
    await Promise.all(
      [...selected].map(id =>
        authFetch(`/api/employees?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      )
    )
    setSelected(new Set())
    fetchEmployees()
  }

  const toggleSelect = (id: number) => {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === employees.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(employees.map(e => e.id)))
    }
  }

  return {
    employees, total, page, setPage, search, setSearch, pageSize, setPageSize,
    loading, filterStatus, setFilterStatus, filterRole, setFilterRole,
    dirty, setDirty, selected, setSelected, saving, setSaving,
    roles, jobs, contractTypes, identificationTypes,
    fetchEmployees, toggleStatus, saveRow, saveAll, bulkUpdate, toggleSelect, toggleSelectAll
  }
}
