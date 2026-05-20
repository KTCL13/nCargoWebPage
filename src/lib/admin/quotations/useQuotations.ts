import { useState, useCallback, useEffect } from 'react'
import { CotizacionRecord, Office, QuotationTab } from '@/types/admin/quotations'
import { authFetch } from '@/lib/api-client/auth-fetch'

const LIMIT = 10

export function useQuotations(token: string | null) {
  const [tab, setTab] = useState<QuotationTab>('publica')

  // Publica
  const [pubRecords, setPubRecords] = useState<CotizacionRecord[]>([])
  const [pubTotal, setPubTotal] = useState(0)
  const [pubPage, setPubPage] = useState(0)
  const [pubPageSize, setPubPageSize] = useState(LIMIT)
  const [pubLoading, setPubLoading] = useState(false)

  // Empleados
  const [empRecords, setEmpRecords] = useState<CotizacionRecord[]>([])
  const [empTotal, setEmpTotal] = useState(0)
  const [empPage, setEmpPage] = useState(0)
  const [empPageSize, setEmpPageSize] = useState(LIMIT)
  const [empLoading, setEmpLoading] = useState(false)

  // Offices
  const [offices, setOffices] = useState<Office[]>([])
  const [loadingO, setLoadingO] = useState(false)

  const fetchPublica = useCallback(async () => {
    setPubLoading(true)
    try {
      const res = await authFetch(`/api/cotizacion-records?source=PUBLIC&page=${pubPage + 1}&pageSize=${pubPageSize}`)
      const data = await res.json()
      setPubRecords(data.data ?? [])
      setPubTotal(data.total ?? 0)
    } catch { } finally { setPubLoading(false) }
  }, [pubPage, pubPageSize])

  const fetchEmpleados = useCallback(async () => {
    setEmpLoading(true)
    try {
      const res = await authFetch(`/api/cotizacion-records?source=EMPLOYEE&page=${empPage + 1}&pageSize=${empPageSize}`)
      const data = await res.json()
      setEmpRecords(data.data ?? [])
      setEmpTotal(data.total ?? 0)
    } catch { } finally { setEmpLoading(false) }
  }, [empPage, empPageSize])

  const fetchOffices = useCallback(async () => {
    setLoadingO(true)
    try {
      const res = await authFetch('/api/pickup-points')
      const data = await res.json()
      setOffices(data.data ?? [])
    } catch { } finally { setLoadingO(false) }
  }, [])

  useEffect(() => { if (tab === 'publica') fetchPublica() }, [tab, fetchPublica])
  useEffect(() => { if (tab === 'empleados') fetchEmpleados() }, [tab, fetchEmpleados])
  useEffect(() => { if (tab === 'offices') fetchOffices() }, [tab, fetchOffices])

  return {
    tab, setTab,
    pubRecords, pubTotal, pubPage, setPubPage, pubPageSize, setPubPageSize, pubLoading,
    empRecords, empTotal, empPage, setEmpPage, empPageSize, setEmpPageSize, empLoading,
    offices, loadingO, fetchPublica, fetchEmpleados, fetchOffices
  }
}
