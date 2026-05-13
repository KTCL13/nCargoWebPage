import { useState, useCallback, useEffect } from 'react'
import { Contract } from '@/types/admin/contracts'

const DEFAULT_LIMIT = 10

export function useContracts() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const [dirty, setDirty] = useState<Record<number, { isActive: boolean }>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState<Set<number>>(new Set())

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyList, setHistoryList] = useState<Contract[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyEmpName, setHistoryEmpName] = useState('')

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setDirty({})
    setSelected(new Set())
    try {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(pageSize), ...(search && { search }) })
      const res = await fetch(`/api/contracts?${params}`)
      if (!res.ok) throw new Error('API Error')
      const data = await res.json()
      setContracts(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [page, pageSize, search])

  useEffect(() => { fetchContracts() }, [fetchContracts])

  const toggleActive = (id: number, current: boolean) => {
    setDirty(d => ({ ...d, [id]: { ...(d[id] ?? {}), isActive: !(d[id]?.isActive ?? current) } }))
  }

  const saveRow = async (id: number) => {
    const changes = dirty[id]
    if (!changes) return
    setSaving(s => new Set(s).add(id))
    try {
      await fetch(`/api/contracts?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) })
      setDirty(d => { const n = { ...d }; delete n[id]; return n })
      setContracts(list => list.map(c => c.id === id ? { ...c, ...changes } : c))
    } finally { setSaving(s => { const n = new Set(s); n.delete(id); return n }) }
  }

  const saveAll = async () => { await Promise.all(Object.keys(dirty).map(id => saveRow(Number(id)))) }

  const openHistory = async (empId: number, empName: string) => {
    setHistoryOpen(true); setHistoryEmpName(empName); setHistoryLoading(true); setHistoryList([])
    try {
      const res = await fetch(`/api/employees/contracts?employeeId=${empId}`)
      const data = await res.json()
      setHistoryList(Array.isArray(data) ? data : (data.data ?? []))
    } catch { alert('Error') } finally { setHistoryLoading(false) }
  }

  return {
    contracts, total, page, setPage, search, setSearch, pageSize, setPageSize, loading,
    dirty, setDirty, selected, setSelected, saving, historyOpen, setHistoryOpen, historyList, historyLoading, historyEmpName,
    fetchContracts, toggleActive, saveRow, saveAll, openHistory
  }
}
