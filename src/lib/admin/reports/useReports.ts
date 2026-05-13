import { useState, useCallback, useEffect, useMemo } from 'react'
import { Alert, PerformanceEntry, WorkloadEntry, CompletionEntry, Employee, AppliedFilters } from '@/types/admin/reports'

const PERF_LIMIT = 10

function buildBaseParams(f: AppliedFilters) {
  const p = new URLSearchParams()
  if (f.from) {
    const d = new Date(f.from + 'T00:00:00')
    p.set('from', d.toISOString())
  }
  if (f.to) {
    const d = new Date(f.to + 'T23:59:59.999')
    p.set('to', d.toISOString())
  }
  if (f.employeeId) p.set('employeeId', f.employeeId)
  return p
}

export function useReports(token: string | null) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [performance, setPerformance] = useState<PerformanceEntry[]>([])
  const [perfTotal, setPerfTotal] = useState(0)
  const [perfPage, setPerfPage] = useState(0)
  const [workload, setWorkload] = useState<WorkloadEntry[]>([])
  const [completion, setCompletion] = useState<CompletionEntry[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ from: '', to: '', employeeId: '' })

  const [loading, setLoading] = useState({ alerts: true, performance: true, workload: true, completion: true })

  const fetchMain = useCallback(async () => {
    if (!token) return
    setLoading({ alerts: true, performance: true, workload: true, completion: true })

    const auth = { Authorization: `Bearer ${token}` }
    const base = buildBaseParams(appliedFilters)
    const perfQ = new URLSearchParams(base)
    perfQ.set('page', '1')
    perfQ.set('limit', String(PERF_LIMIT))

    const [ar, wr, cr, pr] = await Promise.allSettled([
      fetch(`/api/analytics/alerts?${base}`, { headers: auth }).then(r => r.json()),
      fetch(`/api/analytics/workload?${base}`, { headers: auth }).then(r => r.json()),
      fetch(`/api/analytics/task-completion?${base}`, { headers: auth }).then(r => r.json()),
      fetch(`/api/analytics/employee-performance?${perfQ}`, { headers: auth }).then(r => r.json()),
    ])

    setAlerts(ar.status === 'fulfilled' && Array.isArray(ar.value) ? ar.value : [])
    setWorkload(wr.status === 'fulfilled' && Array.isArray(wr.value) ? wr.value : [])
    setCompletion(cr.status === 'fulfilled' && Array.isArray(cr.value) ? cr.value : [])

    if (pr.status === 'fulfilled') {
      const d = pr.value
      setPerformance(Array.isArray(d) ? d : (d.data ?? []))
      setPerfTotal(Array.isArray(d) ? d.length : (d.total ?? 0))
    }

    setPerfPage(0)
    setLoading({ alerts: false, performance: false, workload: false, completion: false })
  }, [token, appliedFilters])

  useEffect(() => { fetchMain() }, [fetchMain])

  useEffect(() => {
    if (!token) return
    fetch('/api/employees?limit=200', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : (data.data ?? [])))
      .catch(() => { })
  }, [token])

  const handlePerfPageChange = useCallback(async (page: number) => {
    if (!token) return
    setPerfPage(page)
    setLoading(l => ({ ...l, performance: true }))
    const auth = { Authorization: `Bearer ${token}` }
    const params = buildBaseParams(appliedFilters)
    params.set('page', String(page + 1))
    params.set('limit', String(PERF_LIMIT))
    try {
      const res = await fetch(`/api/analytics/employee-performance?${params}`, { headers: auth })
      const d = await res.json()
      setPerformance(Array.isArray(d) ? d : (d.data ?? []))
      setPerfTotal(Array.isArray(d) ? d.length : (d.total ?? 0))
    } catch { }
    setLoading(l => ({ ...l, performance: false }))
  }, [token, appliedFilters])

  return {
    alerts, performance, perfTotal, perfPage, workload, completion, employees,
    fromDate, setFromDate, toDate, setToDate, selectedEmployeeId, setSelectedEmployeeId,
    appliedFilters, setAppliedFilters, loading, fetchMain, handlePerfPageChange
  }
}
