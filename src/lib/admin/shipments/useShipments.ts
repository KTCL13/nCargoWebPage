import { useState, useCallback, useEffect, useRef } from 'react'
import { Locker, Envio } from '@/types/admin/shipments'
import { authFetch } from '@/lib/api-client/auth-fetch'

const DEFAULT_LIMIT = 10

export function useShipments(token: string | null) {
  const headers = { Authorization: `Bearer ${token ?? ''}` }

  // Lockers
  const [lockers, setLockers] = useState<Locker[]>([])
  const [lockersTotal, setLockersTotal] = useState(0)
  const [lockersPage, setLockersPage] = useState(0)
  const [lockersPageSize, setLockersPageSize] = useState(DEFAULT_LIMIT)
  const [lockersLoading, setLockersLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncTerm, setSyncTerm] = useState('')

  // Envíos
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null)
  const [envios, setEnvios] = useState<Envio[]>([])
  const [enviosTotal, setEnviosTotal] = useState(0)
  const [enviosPage, setEnviosPage] = useState(0)
  const [enviosPageSize, setEnviosPageSize] = useState(DEFAULT_LIMIT)
  const [enviosLoading, setEnviosLoading] = useState(false)
  const [envioSearch, setEnvioSearch] = useState('')
  const [debouncedEnvioSearch, setDebouncedEnvioSearch] = useState('')

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => setDebouncedEnvioSearch(envioSearch), 350)
    return () => { if (searchRef.current) clearTimeout(searchRef.current) }
  }, [envioSearch])

  const loadLockers = useCallback(async () => {
    setLockersLoading(true)
    try {
      const p = new URLSearchParams({ page: String(lockersPage + 1), limit: String(lockersPageSize) })
      const res = await authFetch(`/api/lockers?${p}`, { headers })
      const json = await res.json()
      setLockers(json.data ?? [])
      setLockersTotal(json.total ?? 0)
    } catch (e) { console.error(e) } finally { setLockersLoading(false) }
  }, [lockersPage, lockersPageSize, token])

  const loadEnvios = useCallback(async () => {
    if (!selectedLocker) return
    setEnviosLoading(true)
    try {
      const params = new URLSearchParams({ page: String(enviosPage + 1), limit: String(enviosPageSize) })
      if (debouncedEnvioSearch) params.set('search', debouncedEnvioSearch)
      const res = await authFetch(`/api/lockers/${selectedLocker.id}/shipments?${params}`, { headers })
      const json = await res.json()
      setEnvios(json.data ?? [])
      setEnviosTotal(json.total ?? 0)
    } catch (e) { console.error(e) } finally { setEnviosLoading(false) }
  }, [selectedLocker, debouncedEnvioSearch, enviosPage, enviosPageSize, token])

  useEffect(() => { loadLockers() }, [loadLockers])
  useEffect(() => { loadEnvios() }, [loadEnvios])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await authFetch('/api/odoo/sync-lockers', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: syncTerm.trim() || undefined }),
      })
      if (res.ok) { loadLockers(); if (selectedLocker) loadEnvios() }
    } finally { setSyncing(false) }
  }

  return {
    lockers, lockersTotal, lockersPage, setLockersPage, lockersPageSize, setLockersPageSize, lockersLoading,
    syncing, syncTerm, setSyncTerm, handleSync,
    selectedLocker, setSelectedLocker, envios, enviosTotal, enviosPage, setEnviosPage, enviosPageSize, setEnviosPageSize, enviosLoading,
    envioSearch, setEnvioSearch, loadLockers, loadEnvios
  }
}
