import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Shipment, RowFeedback } from './types'
import { authFetch } from '@/lib/api-client/auth-fetch'

const DEFAULT_LIMIT = 10

export function useEnvios() {
  const { token } = useAuth()
  const authToken = token ?? ''

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Per-row tracking edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [rowFeedback, setRowFeedback] = useState<RowFeedback | null>(null)

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(0)
    }, 400)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [search])

  const fetchShipments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        pageSize: String(pageSize),
        isLocker: 'true',
      })
      if (debouncedSearch) params.set('search', debouncedSearch)

      const res = await authFetch(`/api/shipments?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const json = await res.json()
      setShipments(json.data ?? [])
      setTotal(json.total ?? 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch, authToken])

  useEffect(() => { fetchShipments() }, [fetchShipments])

  const startEdit = useCallback((s: Shipment) => {
    setEditingId(s.id)
    setEditValue(s.trackingNumber ?? '')
    setRowFeedback(null)
  }, [])

  const saveTracking = useCallback(async (s: Shipment) => {
    if (!editValue.trim()) return
    setSaving(true)
    try {
      const res = await authFetch('/api/shipments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ id: s.id, trackingNumber: editValue.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? 'Error')
      setRowFeedback({ id: s.id, msg: 'Guardado', ok: true })
      setEditingId(null)
      fetchShipments()
    } catch (err) {
      setRowFeedback({ id: s.id, msg: (err as Error).message, ok: false })
    } finally {
      setSaving(false)
      setTimeout(() => setRowFeedback(null), 3000)
    }
  }, [editValue, authToken, fetchShipments])

  return {
    shipments, total, page, setPage, pageSize, setPageSize, loading,
    search, setSearch,
    editingId, setEditingId, editValue, setEditValue, saving, rowFeedback,
    fetchShipments, startEdit, saveTracking
  }
}
