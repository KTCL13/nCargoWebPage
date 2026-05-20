import { useState, useCallback, useEffect } from 'react'
import { AttendanceRegistry, AttendanceEmployee } from '@/types/admin/attendance'

const DEFAULT_LIMIT = 10

export function useAttendance(token: string | null) {
  const [registries, setRegistries] = useState<AttendanceRegistry[]>([])
  const [employees, setEmployees] = useState<AttendanceEmployee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  const [dateFilter, setDateFilter] = useState("")
  const [employeeFilter, setEmployeeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Reset page when filters change
  useEffect(() => {
    setPage(0)
  }, [dateFilter, employeeFilter, statusFilter])

  const fetchAttendance = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(pageSize),
        ...(dateFilter && { date: dateFilter }),
        ...(employeeFilter && { employeeId: employeeFilter }),
        ...(statusFilter && { status: statusFilter }),
      })

      const auth = { Authorization: `Bearer ${token}` }
      const [res, empRes] = await Promise.all([
        fetch(`/api/attendance?${params}`, { headers: auth }),
        fetch("/api/employees?limit=100", { headers: auth }),
      ])

      const data = await res.json()
      const empsData = await empRes.json()

      const emps = Array.isArray(empsData) ? empsData : (empsData.data ?? [])
      setEmployees(emps)

      const list = (data.data ?? []).map((r: AttendanceRegistry) => ({
        ...r,
        employee: emps.find((e: AttendanceEmployee) => e.id === r.employeeId),
      }))

      setRegistries(list)
      setTotal(data.total ?? 0)
    } catch (err) {
      console.error("Error fetching attendance:", err)
    } finally {
      setLoading(false)
    }
  }, [token, page, pageSize, dateFilter, employeeFilter, statusFilter])

  useEffect(() => { fetchAttendance() }, [fetchAttendance])

  const handleCloseJourney = async (id: number) => {
    if (!token) return
    if (!confirm("¿Seguro que deseas cerrar esta jornada manualmente?")) return
    try {
      const res = await fetch(`/api/attendance/force-close?id=${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchAttendance()
      } else {
        const err = await res.json()
        alert(err.message || "Error al cerrar jornada")
      }
    } catch (err) {
      alert("Error de conexión")
    }
  }

  return {
    registries, total, page, setPage, pageSize, setPageSize, loading,
    dateFilter, setDateFilter, employeeFilter, setEmployeeFilter, statusFilter, setStatusFilter,
    fetchAttendance, handleCloseJourney
  }
}
