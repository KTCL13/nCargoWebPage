import { useState, useCallback, useEffect } from 'react'
import { Job } from '@/types/admin/jobs'
import { authFetch } from '@/lib/api-client/auth-fetch'

const DEFAULT_LIMIT = 10

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page + 1), limit: String(pageSize) })
      const res = await authFetch(`/api/jobs?${params}`)
      const data = await res.json()
      setJobs(data.data ?? [])
      setTotal(data.total ?? 0)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }, [page, pageSize])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const deleteJob = async (id: number) => {
    if (!confirm('¿Eliminar?')) return
    try {
      const res = await authFetch(`/api/jobs?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchJobs()
    } catch { alert('Error') }
  }

  return { jobs, total, page, setPage, pageSize, setPageSize, loading, fetchJobs, deleteJob }
}
