'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { NAV_ITEMS } from '@/components/layout/nav-config'
import { Pagination } from '@/components/ui/Pagination'

const LIMIT = 10

type Employee = {
  id: number
  name: string
  email: string
  status: 'ACTIVE' | 'INACTIVE'
  roles: string[]
  activeContract: { id: number; job: { title: string } } | null
  createdAt: string
}

type Role = { id: number; name: string }
type Job = { id: number; title: string }
type ContractType = { id: number; name: string }

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
}

function avatarColor(name: string) {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-orange-500', 'bg-pink-500']
  return colors[name.charCodeAt(0) % colors.length]
}

export default function EmpleadosPage() {
  const router = useRouter()

  // Table state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
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
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', identification: '', email: '', password: '', phone: '',
    roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    jobId: '', contractTypeId: '',
    salary: '', hourlyRate: '', startDate: '', endDate: '',
  })
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterRole, setFilterRole] = useState<string>('')

  // KPI
  const [activeCount, setActiveCount] = useState<number | null>(null)

  // ── Fetch employees ──────────────────────────────────────────────────
  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    setDirty({})
    setSelected(new Set())
    try {
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: String(LIMIT),
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
  }, [page, search])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

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
    setEditingId(emp?.id ?? null)
    setIsViewOnly(view)

    const emptyForm = {
      firstName: '', lastName: '', identification: '', email: '', password: '', phone: '',
      roleId: '', status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
      jobId: '', contractTypeId: '',
      salary: '', hourlyRate: '', startDate: '', endDate: '',
    }
    setForm(emptyForm)

    // Load dependencies (roles, jobs, etc)
    const [r, j, ct] = await Promise.all([
      fetch('/api/roles').then(x => x.json()),
      fetch('/api/jobs').then(x => x.json()),
      fetch('/api/contract-types').then(x => x.json()),
    ])
    setRoles(r)
    setJobs(j)
    setContractTypes(ct)

    // If editing or viewing, fetch full employee details and populate form
    if (emp) {
      setModalLoading(true)
      try {
        const res = await fetch(`/api/employees?id=${emp.id}`)
        if (!res.ok) throw new Error('Error al cargar datos')
        const fullData = await res.json()

        // Map roles: if fullData.roles is objects, get id, else find in roles list
        const roleId = fullData.roles?.[0]?.id?.toString() ||
          r.find((role: Role) => role.name === fullData.roles?.[0])?.id?.toString() || '';

        const [firstName, ...lastNames] = (fullData.name || '').split(' ')
        setForm({
          ...emptyForm,
          firstName: firstName || '',
          lastName: lastNames.join(' ') || '',
          identification: fullData.metadata?.identification || '',
          email: fullData.email || '',
          status: fullData.status || 'ACTIVE',
          phone: fullData.metadata?.phone || '',
          roleId: roleId,
          jobId: fullData.activeContract?.job?.id?.toString() || '',
          contractTypeId: fullData.activeContract?.contractTypeId?.toString() || '',
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
    setModalLoading(true)
    setModalError('')
    try {
      const isEditing = editingId !== null
      const url = isEditing ? `/api/employees?id=${editingId}` : '/api/employees'
      const method = isEditing ? 'PUT' : 'POST'

      const body: any = {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        status: form.status,
        roleIds: [Number(form.roleId)],
        metadata: {
          phone: form.phone,
          identification: form.identification,
        },
      }

      // Only include password if creating or if provided during edit
      if (!isEditing || form.password) {
        body.password = form.password
      }

      const empRes = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const empData = await empRes.json()
      if (!empRes.ok) throw new Error(empData.message || 'Error en la operación')

      // Handle contract (only if provided)
      if (form.jobId && form.contractTypeId) {
        // For simplicity, we use the same endpoint, 
        // usually it handles create or update based on employee ID
        await fetch(`/api/employees/contracts?id=${isEditing ? editingId : empData.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: Number(form.jobId),
            contractTypeId: Number(form.contractTypeId),
            salary: Number(form.salary),
            hourlyRate: Number(form.hourlyRate),
            startDate: form.startDate,
            ...(form.endDate && { endDate: form.endDate }),
          }),
        })
      }

      setShowModal(false)
      fetchEmployees()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Error al guardar empleado')
    } finally {
      setModalLoading(false)
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

  const pageCount = Math.ceil(total / LIMIT)
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
                <option value="">Todos los roles</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre o email..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0) }}
                className="pl-8 pr-3 py-2 rounded-[var(--radius-lg)] border border-gray-200 text-xs font-subtitles focus:outline-none focus:border-[var(--color-primary)] w-40"
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
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Estado</th>
                <th className="px-4 py-3 text-left font-subtitles text-xs uppercase tracking-wide text-gray-500">Acciones</th>
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
                        {emp.roles[0] ?? '—'}
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {emp.activeContract && (
                          <span className="text-xs text-gray-500 font-subtitles border border-gray-200 px-2 py-1 rounded-[var(--radius-md)]">
                            📋 {emp.activeContract.job.title}
                          </span>
                        )}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-[var(--radius-lg)] border border-gray-100">
                          <button
                            onClick={() => openModal(emp, true)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-white rounded-[var(--radius-md)] transition-all"
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openModal(emp, false)}
                            className="p-1.5 text-gray-500 hover:text-[var(--color-primary)] hover:bg-white rounded-[var(--radius-md)] transition-all"
                            title="Editar detalles"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => saveRow(emp.id)}
                            disabled={!isDirty || isSaving}
                            className={`
                              text-[10px] px-2 py-1 rounded-[var(--radius-md)] font-bold font-subtitles transition uppercase tracking-tighter
                              ${isDirty && !isSaving
                                ? 'bg-[var(--color-foreground)] text-white hover:opacity-80'
                                : 'bg-transparent text-gray-300 cursor-not-allowed'
                              }
                            `}
                          >
                            {isSaving ? '...' : 'Guardar Cambios'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={saveAll}
              disabled={!hasDirty}
              className={`
                text-sm px-4 py-2 rounded-[var(--radius-lg)] font-semibold font-subtitles transition
                ${hasDirty
                  ? 'bg-[var(--color-foreground)] text-white hover:opacity-80'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Guardar todo {hasDirty ? `(${Object.keys(dirty).length})` : ''}
            </button>
            <p className="text-xs font-subtitles text-gray-500">
              Mostrando <span className="font-bold text-gray-700">{employees.length > 0 ? page * LIMIT + 1 : 0}</span> - <span className="font-bold text-gray-700">{Math.min((page + 1) * LIMIT, total)}</span> de <span className="font-bold text-gray-700">{total}</span> empleados
            </p>
          </div>

          <Pagination
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
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
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
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
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Identificación <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="C.C. / DNI / Pasaporte"
                      disabled={isViewOnly}
                      value={form.identification} onChange={e => setForm(f => ({ ...f, identification: e.target.value }))}
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
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">
                      Contraseña {editingId ? <span className="text-gray-400 font-normal">(dejar en blanco para no cambiar)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password" required={!editingId} placeholder="••••••••"
                      disabled={isViewOnly}
                      value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
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
                      {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Contract section */}
              <div>
                <p className="font-subtitles text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Contrato inicial
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
                      onChange={e => setForm(f => ({ ...f, contractTypeId: e.target.value }))}
                      className="form-input bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">Seleccionar...</option>
                      {contractTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Salario <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="0.00" inputMode="decimal"
                      value={form.salary}
                      disabled={isViewOnly}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setForm(f => ({ ...f, salary: val }));
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Tarifa por hora <span className="text-red-500">*</span></label>
                    <input
                      type="text" required placeholder="0.00" inputMode="decimal"
                      value={form.hourlyRate}
                      disabled={isViewOnly}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setForm(f => ({ ...f, hourlyRate: val }));
                      }}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de inicio <span className="text-red-500">*</span></label>
                    <input
                      type="date" required
                      disabled={isViewOnly}
                      value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-subtitles font-semibold text-gray-600 mb-1">Fecha de fin <span className="text-gray-400">(opcional)</span></label>
                    <input
                      type="date"
                      disabled={isViewOnly}
                      value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="form-input disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              {modalError && (
                <p className="text-xs text-[var(--color-primary)] px-3 py-2 bg-red-50 rounded-[var(--radius-lg)] border border-red-100">
                  {modalError}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
