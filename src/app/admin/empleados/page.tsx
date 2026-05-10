'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'

const DEFAULT_LIMIT = 10

type IdentificationType = { id: number; code: string; name: string }

type Employee = {
  id: number
  firstName: string
  lastName: string
  name: string
  identificationNumber: string
  identificationType: IdentificationType
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  roles: string[]
  activeContract: { id: number; job: { title: string } } | null
  createdAt: string
}

type Role = { id: number; name: string }
type Job = { id: number; title: string }
type ContractType = { id: number; name: string }
// IdentificationType already declared above

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-pink-500']
  return colors[name.charCodeAt(0) % colors.length]
}

const roleTranslations: Record<string, string> = {
  'ADMIN': 'Administrador',
  'EMPLOYEE': 'Empleado',
}

function translateRole(role: string) {
  return roleTranslations[role] || role
}

export default function EmpleadosPage() {
  const router = useRouter()

  // Table state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT)
  const [loading, setLoading] = useState(false)

  // Dirty rows: pending status changes not yet saved
  const [dirty, setDirty] = useState<Record<number, 'ACTIVE' | 'INACTIVE'>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState<Set<number>>(new Set())

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [contractTypes, setContractTypes] = useState<ContractType[]>([])
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
    email: '', password: '', phone: '',
    roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    jobId: '', contractTypeId: '',
    salary: '', hourlyRate: '', startDate: '', endDate: '',
  })
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')

  // Contract modal (assign a new contract to existing employee)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [contractModalEmpId, setContractModalEmpId] = useState<number | null>(null)
  const [contractModalEmpName, setContractModalEmpName] = useState('')
  const [contractModalLoading, setContractModalLoading] = useState(false)
  const [contractModalError, setContractModalError] = useState('')
  const [contractForm, setContractForm] = useState({
    jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '',
  })

  // Duplicate-contact warning (email / phone soft-warning before save)
  const [dupWarning, setDupWarning] = useState<{ message: string } | null>(null)
  const [skipDupCheck, setSkipDupCheck] = useState(false)

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false)

  // KPI
  const [activeCount, setActiveCount] = useState<number | null>(null)

  function passwordStrength(pw: string) {
    const checks = {
      length:  { met: pw.length >= 8,          label: 'Mínimo 8 caracteres' },
      upper:   { met: /[A-Z]/.test(pw),         label: '1 letra mayúscula' },
      lower:   { met: /[a-z]/.test(pw),         label: '1 letra minúscula' },
      number:  { met: /[0-9]/.test(pw),         label: '1 número' },
      special: { met: /[^A-Za-z0-9]/.test(pw), label: '1 carácter especial' },
    }
    const score = Object.values(checks).filter(c => c.met).length
    const isValid = checks.length.met && checks.upper.met && checks.lower.met && checks.number.met
    const configs = [
      { label: 'Muy débil', color: 'bg-red-500',    text: 'text-red-600'    },
      { label: 'Débil',     color: 'bg-orange-400', text: 'text-orange-500' },
      { label: 'Regular',   color: 'bg-yellow-400', text: 'text-yellow-600' },
      { label: 'Buena',     color: 'bg-blue-500',   text: 'text-blue-600'   },
      { label: 'Fuerte',    color: 'bg-green-500',  text: 'text-green-600'  },
    ]
    const cfg = configs[Math.max(0, score - 1)] ?? configs[0]
    return { score, isValid, checks: Object.values(checks), ...cfg }
  }

  // Determines whether a contract type is hourly-based (POR_HORA) vs monthly (MENSUAL)
  function isHourlyContractType(typeId: string | number) {
    if (!typeId) return false
    const type = contractTypes.find(ct => String(ct.id) === String(typeId))
    return type?.name?.toUpperCase().includes('HORA') ?? false
  }

  // ── Fetch employees ──────────────────────────────────────────────────
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
      const res = await fetch(`/api/employees?${params}`)
      const data = await res.json()
      setEmployees(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filterStatus, filterRole])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  // Fetch dependencies on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then(x => x.json()),
      fetch('/api/jobs').then(x => x.json()),
      fetch('/api/contract-types').then(x => x.json()),
      fetch('/api/identification-types').then(x => x.json()),
    ]).then(([r, j, ct, it]) => {
      setRoles(r)
      setJobs(j)
      setContractTypes(ct)
      setIdentificationTypes(it)
    }).catch(err => console.error('Error fetching dependencies:', err))
  }, [])

  // KPI
  useEffect(() => {
    fetch('/api/employees?status=ACTIVE&limit=1')
      .then(r => r.json())
      .then(d => setActiveCount(d.total ?? 0))
      .catch(() => setActiveCount(0))
  }, [employees])

  // ── Dropdown data for modal ──────────────────────────────────────────
  // ── Modal logic ──────────────────────────────────────────────────
  async function openModal(emp?: Employee, view = false) {
    setShowModal(true)
    setModalError('')
    setDupWarning(null)
    setSkipDupCheck(false)
    setShowPassword(false)
    setEditingId(emp?.id ?? null)
    setIsViewOnly(view)

    const emptyForm = {
      firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
      email: '', password: '', phone: '',
      roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
      jobId: '', contractTypeId: '',
      salary: '', hourlyRate: '', startDate: '', endDate: '',
    }
    setForm(emptyForm)

    // If editing or viewing, fetch full employee details and populate form
    if (emp) {
      setModalLoading(true)
      try {
        const res = await fetch(`/api/employees?id=${emp.id}`)
        if (!res.ok) throw new Error('Error al cargar datos')
        const fullData = await res.json()

        const roleId = roles.find((role: Role) => role.name === fullData.roles?.[0])?.id?.toString() || ''

        setForm({
          ...emptyForm,
          firstName: fullData.firstName || '',
          lastName: fullData.lastName || '',
          identificationNumber: fullData.identificationNumber || '',
          identificationTypeId: fullData.identificationType?.id?.toString() || '',
          email: fullData.email || '',
          status: fullData.status || 'ACTIVE',
          phone: fullData.metadata?.phone || '',
          roleId,
          jobId: fullData.activeContract?.job?.id?.toString() || '',
          contractTypeId: fullData.activeContract?.contractType?.id?.toString() || '',
          salary: fullData.activeContract?.salary?.toString() || '',
          hourlyRate: fullData.activeContract?.hourlyRate?.toString() || '',
          startDate: fullData.activeContract?.startDate ? new Date(fullData.activeContract.startDate).toISOString().split('T')[0] : '',
          endDate: fullData.activeContract?.endDate ? new Date(fullData.activeContract.endDate).toISOString().split('T')[0] : '',
        })
      } catch (err) {
        setModalError('No se pudieron cargar los datos completos del empleado')
      } finally {
        setModalLoading(false)
      }
    }
  }

  // ── Handle Submit (Create or Update) ───────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setModalError('')

    // Block weak passwords on creation, or when a new password is provided on edit
    if (form.password) {
      const { isValid } = passwordStrength(form.password)
      if (!isValid) {
        setModalError('La contraseña no cumple los requisitos mínimos de seguridad')
        return
      }
    }

    // Soft-warning check for duplicate email / phone (skip if user already confirmed)
    if (!skipDupCheck) {
      const phone = form.phone.replace(/\s/g, '')
      const params = new URLSearchParams()
      if (form.email) params.set('email', form.email)
      if (phone) params.set('phone', phone)
      if (editingId) params.set('excludeId', String(editingId))

      try {
        const checkRes = await fetch(`/api/employees/check-duplicate?${params}`)
        if (checkRes.ok) {
          const { emailOwner, phoneOwner } = await checkRes.json()
          const parts: string[] = []
          if (emailOwner) parts.push(`el correo ya pertenece a ${emailOwner}`)
          if (phoneOwner) parts.push(`el teléfono ya pertenece a ${phoneOwner}`)
          if (parts.length > 0) {
            setDupWarning({ message: `¿Seguro que quieres guardar? ${parts.join(' y ')}. ¿Continuar de todas formas?` })
            return
          }
        }
      } catch {
        // If check fails, proceed normally
      }
    }

    setSkipDupCheck(false)
    setDupWarning(null)
    setModalLoading(true)
    try {
      const isEditing = editingId !== null
      const url = isEditing ? `/api/employees?id=${editingId}` : '/api/employees'
      const method = isEditing ? 'PUT' : 'POST'

      const body: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        identificationNumber: form.identificationNumber.trim(),
        identificationTypeId: Number(form.identificationTypeId),
        email: form.email,
        status: form.status,
        roleIds: [Number(form.roleId)],
        metadata: { phone: form.phone },
      }

      // Only include password if creating or if provided during edit
      if (!isEditing || form.password) {
        body.password = form.password
      }

      // For new employees, include the initial contract in the same request
      // so the backend creates both atomically (or fails without creating either).
      if (!isEditing && form.jobId && form.contractTypeId) {
        body.initialContract = {
          jobId: Number(form.jobId),
          contractTypeId: Number(form.contractTypeId),
          salary: form.salary ? Number(form.salary) : 0,
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : 0,
          startDate: form.startDate,
          ...(form.endDate && { endDate: form.endDate }),
        }
      }

      const empRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const empData = await empRes.json()
      if (!empRes.ok) throw new Error(empData.message || 'Error en la operación')

      setShowModal(false)
      fetchEmployees()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al guardar empleado')
    } finally {
      setModalLoading(false)
    }
  }

  // ── Contract modal (assign new contract to existing employee) ─────────
  function openContractModal(emp: Employee) {
    setContractModalEmpId(emp.id)
    setContractModalEmpName(emp.name)
    setContractForm({ jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '' })
    setContractModalError('')
    setContractModalOpen(true)
  }

  async function handleContractSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contractModalEmpId) return
    setContractModalLoading(true)
    setContractModalError('')
    try {
      const res = await fetch(`/api/employees/contracts?employeeId=${contractModalEmpId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: Number(contractForm.jobId),
          contractTypeId: Number(contractForm.contractTypeId),
          salary: contractForm.salary ? Number(contractForm.salary) : 0,
          hourlyRate: contractForm.hourlyRate ? Number(contractForm.hourlyRate) : 0,
          startDate: contractForm.startDate,
          ...(contractForm.endDate && { endDate: contractForm.endDate }),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Error creando contrato')
      }
      setContractModalOpen(false)
      fetchEmployees()
    } catch (err) {
      setContractModalError(err instanceof Error ? err.message : 'Error al crear contrato')
    } finally {
      setContractModalLoading(false)
    }
  }

  // ── Toggle status (marks dirty, no API call yet) ──────────────────────
  function toggleStatus(id: number, current: 'ACTIVE' | 'INACTIVE') {
    const currentStatus = dirty[id] ?? current
    setDirty(d => ({ ...d, [id]: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }))
  }

  // ── Save single row ──────────────────────────────────────────────────
  async function saveRow(id: number) {
    const status = dirty[id]
    if (!status) return
    setSaving(s => new Set(s).add(id))
    try {
      await fetch(`/api/employees?id=${id}`, {
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

  // ── Save all dirty rows ───────────────────────────────────────────────
  async function saveAll() {
    await Promise.all(Object.keys(dirty).map(id => saveRow(Number(id))))
  }

  // ── Bulk status change ────────────────────────────────────────────────
  async function bulkUpdate(status: 'ACTIVE' | 'INACTIVE') {
    await Promise.all(
      [...selected].map(id =>
        fetch(`/api/employees?id=${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
      )
    )
    setSelected(new Set())
    fetchEmployees()
  }

  // ── Checkboxes ────────────────────────────────────────────────────────
  function toggleSelect(id: number) {
    setSelected(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleSelectAll() {
    if (selected.size === employees.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(employees.map(e => e.id)))
    }
  }

  const hasDirty = Object.keys(dirty).length > 0

  return (
    <DashboardLayout
      pageTitle="Empleados"
      navItems={NAV_ITEMS}
      onReload={() => window.location.reload()}
    >
      {/* KPI */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-4 bg-[var(--color-foreground)] rounded-[var(--radius-xl)] px-6 py-5 min-w-[180px]">
          <div className="w-11 h-11 rounded-[var(--radius-xl)] bg-[var(--color-secondary)] flex items-center justify-center text-white text-xl flex-shrink-0">
            👥
          </div>
          <div>
            <p className="font-subtitles text-xs text-white/60 uppercase tracking-wide">Empleados Activos</p>
            <p className="font-titles text-3xl font-extrabold text-white leading-none mt-1">
              {activeCount === null ? '—' : activeCount}
            </p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] border border-gray-100 overflow-hidden">

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/30">
          <h3 className="font-titles text-lg font-bold text-[var(--color-foreground)]">
            Listado de Empleados
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(0) }}
                className="text-xs font-subtitles px-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 bg-white focus:border-[var(--color-primary)] outline-none"
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
              <select
                value={filterRole}
                onChange={e => { setFilterRole(e.target.value); setPage(0) }}
                className="text-xs font-subtitles px-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 bg-white focus:border-[var(--color-primary)] outline-none"
              >
                <option value="">Tipo de trabajador</option>
                {roles.map(r => <option key={r.id} value={r.id}>{translateRole(r.name)}</option>)}
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre, apellido o cédula..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="pl-8 pr-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 text-xs font-subtitles focus:outline-none focus:border-[var(--color-primary)] w-52"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
            </div>
            <button
              onClick={() => openModal()}
              className="bg-[var(--color-primary)] text-white text-xs font-subtitles font-semibold px-4 py-2 rounded-[var(--radius-lg)] hover:opacity-90 transition whitespace-nowrap"
            >
              + Añadir empleado
            </button>
          </div>
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-5 py-2.5 bg-blue-50 border-b border-blue-100">
            <span className="text-sm font-subtitles text-blue-700 font-medium">
              {selected.size} seleccionado{selected.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => bulkUpdate('ACTIVE')}
              className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              Activar
            </button>
            <button
              onClick={() => bulkUpdate('INACTIVE')}
              className="text-xs px-3 py-1.5 rounded-[var(--radius-lg)] bg-gray-500 text-white font-semibold hover:bg-gray-600 transition"
            >
              Desactivar
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={employees.length > 0 && selected.size === employees.length}
                    onChange={toggleSelectAll}
                    className="accent-[var(--color-primary)] w-4 h-4"
                  />
                </th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Rol</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Cargo</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-3 text-right font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 font-subtitles text-sm">
                    Cargando...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 font-subtitles text-sm">
                    No se encontraron empleados
                  </td>
                </tr>
              ) : employees.map(emp => {
                const currentStatus = dirty[emp.id] ?? emp.status
                const isDirty = dirty[emp.id] !== undefined
                const isSaving = saving.has(emp.id)

                return (
                  <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(emp.id)}
                        onChange={() => toggleSelect(emp.id)}
                        className="accent-[var(--color-primary)] w-4 h-4"
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${avatarColor(emp.name)}`}>
                          {initials(emp.name)}
                        </div>
                        <div>
                          <p className="font-subtitles font-semibold text-[var(--color-foreground)]">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <span className="font-subtitles text-gray-600 text-sm">
                        {translateRole(emp.roles[0] ?? '—')}
                      </span>
                    </td>

                    {/* Job Title */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium font-subtitles text-gray-600 bg-gray-100 px-2 py-1 rounded-[var(--radius-md)]">
                        {emp.activeContract?.job.title ?? 'Sin cargo'}
                      </span>
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <button
                        role="switch"
                        aria-checked={currentStatus === 'ACTIVE'}
                        onClick={() => toggleStatus(emp.id, emp.status)}
                        className="switch-btn"
                        aria-label={`Cambiar estado de ${emp.name} a ${currentStatus === 'ACTIVE' ? 'inactivo' : 'activo'}`}
                      >
                        <span className="switch-thumb" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-[var(--radius-lg)] shadow-sm border border-gray-100">
                          <button
                            onClick={() => openModal(emp, true)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[var(--radius-md)] transition-all"
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openModal(emp, false)}
                            className="p-1.5 text-[var(--color-primary)] hover:bg-red-50 rounded-[var(--radius-md)] transition-all"
                            title="Editar detalles"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => openContractModal(emp)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-[var(--radius-md)] transition-all"
                            title="Asignar nuevo contrato"
                          >
                            📝
                          </button>
                        </div>
                        
                        <button
                          onClick={() => saveRow(emp.id)}
                          disabled={!isDirty || isSaving}
                          className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-lg)] text-xs font-bold font-subtitles transition-all shadow-sm
                            ${isDirty && !isSaving
                              ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }
                          `}
                        >
                          {isSaving ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : '💾'}
                          <span>{isSaving ? 'Guardando' : 'Guardar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-4">
          {hasDirty && (
            <div className="flex justify-start">
              <button
                onClick={saveAll}
                className="text-sm px-4 py-2 rounded-[var(--radius-lg)] font-semibold font-subtitles bg-[var(--color-foreground)] text-white hover:opacity-80 transition shadow-sm"
              >
                Guardar todo ({Object.keys(dirty).length})
              </button>
            </div>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* ── Add Employee Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">
                  {isViewOnly ? 'Detalles del Empleado' : editingId ? 'Editar Empleado' : 'Añadir Empleado'}
                </h2>
                <p className="font-subtitles text-sm text-gray-500 mt-0.5">
                  {isViewOnly ? `Viendo perfil de ${form.firstName} ${form.lastName}` : editingId ? `Modificando a ${form.firstName} ${form.lastName}` : 'Completa los datos con asterisco (*) para continuar'}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); setDupWarning(null); setSkipDupCheck(false) }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">

              {/* Employee section */}
              <div>
                <p className="font-subtitles text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Datos del empleado
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="Ej: Carlos"
                      disabled={isViewOnly}
                      value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Apellido <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="Ej: Pérez"
                      disabled={isViewOnly}
                      value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de identificación <span className="text-red-500">*</span></label>
                    <select
                      required
                      disabled={isViewOnly}
                      value={form.identificationTypeId}
                      onChange={e => setForm(f => ({ ...f, identificationTypeId: e.target.value }))}
                      className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar...</option>
                      {identificationTypes.map(it => (
                        <option key={it.id} value={it.id}>{it.code} — {it.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Número de identificación <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="Ej: 1234567890"
                      disabled={isViewOnly}
                      value={form.identificationNumber} onChange={e => setForm(f => ({ ...f, identificationNumber: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
                    <input
                      type="email" required placeholder="usuario@dominio.com"
                      disabled={isViewOnly}
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                      pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
                      title="Formato requerido válido: usuario@dominio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Teléfono <span className="text-red-500">*</span></label>
                    <div className="flex border border-gray-200 rounded-[var(--radius-lg)] overflow-hidden focus-within:border-[var(--color-primary)]">
                      <select
                        disabled={isViewOnly}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        className="bg-gray-50 px-2 text-sm outline-none disabled:opacity-50"
                      >
                        <option value="+57 ">🇨🇴 +57</option><option value="+1 ">🇺🇸 +1</option><option value="+34 ">🇪🇸 +34</option><option value="+52 ">🇲🇽 +52</option>
                      </select>
                      <input
                        type="text" placeholder="000 000 0000"
                        disabled={isViewOnly}
                        value={form.phone.replace(/^\+\d+\s?/, '')}
                        onChange={e => setForm(f => ({ ...f, phone: (f.phone.match(/^\+\d+\s?/) || [''])[0] + e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Contraseña{' '}
                      {editingId
                        ? <span className="text-gray-400 font-normal">(dejar en blanco para no cambiar)</span>
                        : <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
                        placeholder="••••••••"
                        disabled={isViewOnly}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="form-input pr-10 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                      {!isViewOnly && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592M6.53 6.53A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.065 5.474M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Strength indicator — only shown while typing */}
                    {form.password && !isViewOnly && (() => {
                      const { score, isValid, checks, label, color, text } = passwordStrength(form.password)
                      return (
                        <div className="mt-2 space-y-2">
                          {/* Bar */}
                          <div className="flex gap-1 h-1.5">
                            {[1,2,3,4,5].map(i => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-colors duration-200 ${i <= score ? color : 'bg-gray-100'}`}
                              />
                            ))}
                          </div>
                          {/* Label */}
                          <p className={`text-xs font-semibold font-subtitles ${text}`}>{label}</p>
                          {/* Requirements grid */}
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                            {checks.map((c, i) => (
                              <li key={i} className={`text-xs font-subtitles flex items-center gap-1.5 ${c.met ? 'text-green-600' : 'text-gray-400'}`}>
                                <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] font-bold ${c.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                  {c.met ? '✓' : '○'}
                                </span>
                                {c.label}
                              </li>
                            ))}
                          </ul>
                          {!isValid && (
                            <p className="text-xs text-amber-600 font-subtitles bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] px-2.5 py-1.5">
                              La contraseña no cumple todos los requisitos mínimos.
                            </p>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Rol <span className="text-red-500">*</span></label>
                    <select
                      required value={form.roleId}
                      disabled={isViewOnly}
                      onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}
                      className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar...</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{translateRole(r.name)}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contract section — only shown on create or view (edit uses the dedicated "Asignar nuevo contrato" action) */}
              {(!editingId || isViewOnly) && (
              <div>
                <p className="font-subtitles text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {isViewOnly ? 'Contrato activo' : 'Contrato inicial'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo <span className="text-red-500">*</span></label>
                    <select
                      required value={form.jobId}
                      disabled={isViewOnly}
                      onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}
                      className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar...</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de contrato <span className="text-red-500">*</span></label>
                    <select
                      required value={form.contractTypeId}
                      disabled={isViewOnly}
                      onChange={e => {
                        const newTypeId = e.target.value
                        setForm(f => ({
                          ...f,
                          contractTypeId: newTypeId,
                          salary: isHourlyContractType(newTypeId) ? '' : f.salary,
                          hourlyRate: isHourlyContractType(newTypeId) ? f.hourlyRate : '',
                        }))
                      }}
                      className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar...</option>
                      {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Salario {!isHourlyContractType(form.contractTypeId) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text" placeholder="0.00" inputMode="decimal"
                      required={!isHourlyContractType(form.contractTypeId)}
                      value={form.salary}
                      disabled={isViewOnly || isHourlyContractType(form.contractTypeId)}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setForm(f => ({ ...f, salary: val }));
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Tarifa por hora {isHourlyContractType(form.contractTypeId) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text" placeholder="0.00" inputMode="decimal"
                      required={isHourlyContractType(form.contractTypeId)}
                      value={form.hourlyRate}
                      disabled={isViewOnly || !isHourlyContractType(form.contractTypeId)}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setForm(f => ({ ...f, hourlyRate: val }));
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
                    <input
                      type="date" required
                      disabled={isViewOnly}
                      value={form.startDate}
                      onChange={e => {
                        const newStart = e.target.value
                        setForm(f => ({
                          ...f,
                          startDate: newStart,
                          endDate: f.endDate && f.endDate <= newStart ? '' : f.endDate,
                        }))
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de fin <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="date"
                      disabled={isViewOnly}
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>
              )}

              {dupWarning && (
                <div className="px-3 py-3 bg-yellow-50 rounded-[var(--radius-lg)] border border-yellow-200">
                  <p className="text-xs font-subtitles text-yellow-800 mb-2">{dupWarning.message}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDupWarning(null)}
                      className="flex-1 py-1.5 text-xs rounded-[var(--radius-lg)] border border-yellow-300 text-yellow-800 hover:bg-yellow-100 transition font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSkipDupCheck(true); setDupWarning(null); handleSubmit(new Event('submit') as any) }}
                      className="flex-1 py-1.5 text-xs rounded-[var(--radius-lg)] bg-yellow-500 text-white hover:bg-yellow-600 transition font-semibold"
                    >
                      Sí, guardar de todas formas
                    </button>
                  </div>
                </div>
              )}

              {modalError && (
                <p className="text-xs text-[var(--color-primary)] px-3 py-2 bg-red-50 rounded-[var(--radius-lg)] border border-red-100">
                  {modalError}
                </p>
              )}

              {!dupWarning && (
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setDupWarning(null); setSkipDupCheck(false) }}
                    className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-subtitles font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  {!isViewOnly && (
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-subtitles font-semibold hover:opacity-90 transition disabled:opacity-50"
                    >
                      {modalLoading ? 'Guardando...' : editingId ? 'Actualizar cambios' : 'Guardar empleado'}
                    </button>
                  )}
                  {isViewOnly && (
                    <button
                      type="button"
                      onClick={() => setIsViewOnly(false)}
                      className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-subtitles font-semibold hover:opacity-90 transition"
                    >
                      Habilitar edición
                    </button>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Assign New Contract Modal ── */}
      {contractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">
                  Asignar nuevo contrato
                </h2>
                <p className="font-subtitles text-sm text-gray-500 mt-0.5">
                  Empleado: {contractModalEmpName}
                </p>
              </div>
              <button onClick={() => setContractModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleContractSubmit} className="px-6 py-5 flex flex-col gap-5">
              <div>
                <p className="font-subtitles text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Datos del contrato
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Cargo <span className="text-red-500">*</span></label>
                    <select
                      required value={contractForm.jobId}
                      onChange={e => setContractForm(f => ({ ...f, jobId: e.target.value }))}
                      className="form-input bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tipo de contrato <span className="text-red-500">*</span></label>
                    <select
                      required value={contractForm.contractTypeId}
                      onChange={e => {
                        const newTypeId = e.target.value
                        setContractForm(f => ({
                          ...f,
                          contractTypeId: newTypeId,
                          salary: isHourlyContractType(newTypeId) ? '' : f.salary,
                          hourlyRate: isHourlyContractType(newTypeId) ? f.hourlyRate : '',
                        }))
                      }}
                      className="form-input bg-white"
                    >
                      <option value="">Seleccionar...</option>
                      {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Salario {!isHourlyContractType(contractForm.contractTypeId) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text" placeholder="0.00" inputMode="decimal"
                      required={!isHourlyContractType(contractForm.contractTypeId)}
                      disabled={isHourlyContractType(contractForm.contractTypeId)}
                      value={contractForm.salary}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        setContractForm(f => ({ ...f, salary: val }))
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Tarifa por hora {isHourlyContractType(contractForm.contractTypeId) && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text" placeholder="0.00" inputMode="decimal"
                      required={isHourlyContractType(contractForm.contractTypeId)}
                      disabled={!isHourlyContractType(contractForm.contractTypeId)}
                      value={contractForm.hourlyRate}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '')
                        setContractForm(f => ({ ...f, hourlyRate: val }))
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
                    <input
                      type="date" required
                      value={contractForm.startDate}
                      onChange={e => {
                        const newStart = e.target.value
                        setContractForm(f => ({
                          ...f,
                          startDate: newStart,
                          endDate: f.endDate && f.endDate <= newStart ? '' : f.endDate,
                        }))
                      }}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de fin <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="date"
                      min={contractForm.startDate || undefined}
                      value={contractForm.endDate}
                      onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Al crear el contrato se desactivará automáticamente el contrato vigente.
                </p>
              </div>

              {contractModalError && (
                <p className="text-xs text-[var(--color-primary)] px-3 py-2 bg-red-50 rounded-[var(--radius-lg)] border border-red-100">
                  {contractModalError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setContractModalOpen(false)}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] border border-gray-200 text-sm font-subtitles font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={contractModalLoading}
                  className="flex-1 py-2.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white text-sm font-subtitles font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {contractModalLoading ? 'Guardando...' : 'Crear contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
