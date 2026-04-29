'use client'

import { useState } from 'react'

type Mode = 'create' | 'edit' | 'view'

type Role = { id: number; name: string }
type Job = { id: number; title: string }
type ContractType = { id: number; name: string }

type Props = {
    mode: Mode
    initialData?: any
    roles: Role[]
    jobs: Job[]
    contractTypes: ContractType[]
    onSubmit: (data: any) => Promise<void>
    onClose: () => void
}

export function EmployeeForm({
    mode,
    initialData,
    roles,
    jobs,
    contractTypes,
    onSubmit,
    onClose,
}: Props) {
    const isView = mode === 'view'
    const isEdit = mode === 'edit'

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [form, setForm] = useState({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        identification: initialData?.identification || '',
        email: initialData?.email || '',
        password: '',
        phone: initialData?.phone || '',
        roleId: initialData?.roleId || '',
        status: initialData?.status || 'ACTIVE',
        jobId: initialData?.jobId || '',
        contractTypeId: initialData?.contractTypeId || '',
        salary: initialData?.salary || '',
        hourlyRate: initialData?.hourlyRate || '',
        startDate: initialData?.startDate || '',
        endDate: initialData?.endDate || '',
    })

    function validate() {
        if (
            !form.firstName ||
            !form.lastName ||
            !form.identification ||
            !form.email ||
            (!isEdit && !form.password) ||
            !form.phone ||
            !form.roleId ||
            !form.jobId ||
            !form.contractTypeId ||
            !form.salary ||
            !form.hourlyRate ||
            !form.startDate
        ) {
            return 'Todos los campos obligatorios deben completarse'
        }
        return null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const err = validate()
        if (err) return setError(err)

        setLoading(true)
        setError('')

        try {
            await onSubmit(form)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    function getNameById(list: any[], id: any, key: string) {
        return list.find(i => i.id == id)?.[key] || '—'
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-4">

                <h2 className="text-xl font-bold">
                    {mode === 'create' && 'Crear empleado'}
                    {mode === 'edit' && 'Editar empleado'}
                    {mode === 'view' && 'Detalle del empleado'}
                </h2>

                {/* 👁️ VIEW MODE */}
                {isView ? (
                    <div className="space-y-2 text-sm">
                        <p><b>Nombre:</b> {form.firstName} {form.lastName}</p>
                        <p><b>Email:</b> {form.email}</p>
                        <p><b>Identificación:</b> {form.identification}</p>
                        <p><b>Teléfono:</b> {form.phone}</p>
                        <p><b>Estado:</b> {form.status}</p>

                        <hr />

                        <p><b>Rol:</b> {getNameById(roles, form.roleId, 'name')}</p>
                        <p><b>Cargo:</b> {getNameById(jobs, form.jobId, 'title')}</p>
                        <p><b>Contrato:</b> {getNameById(contractTypes, form.contractTypeId, 'name')}</p>
                        <p><b>Salario:</b> {form.salary}</p>
                        <p><b>Hora:</b> {form.hourlyRate}</p>
                        <p><b>Inicio:</b> {form.startDate}</p>
                        <p><b>Fin:</b> {form.endDate || '—'}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">

                        <input placeholder="Nombre" value={form.firstName}
                            onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                            className="input" />

                        <input placeholder="Apellido" value={form.lastName}
                            onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                            className="input" />

                        <input placeholder="Identificación" value={form.identification}
                            onChange={e => setForm(f => ({ ...f, identification: e.target.value }))}
                            className="input" />

                        <input placeholder="Email" value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="input" />

                        <input type="password" placeholder="Contraseña"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            className="input" />

                        <input placeholder="Teléfono" value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className="input" />

                        <select value={form.roleId}
                            onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))}>
                            <option value="">Rol</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>

                        <select value={form.jobId}
                            onChange={e => setForm(f => ({ ...f, jobId: e.target.value }))}>
                            <option value="">Cargo</option>
                            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                        </select>

                        <select value={form.contractTypeId}
                            onChange={e => setForm(f => ({ ...f, contractTypeId: e.target.value }))}>
                            <option value="">Contrato</option>
                            {contractTypes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>

                        <input placeholder="Salario" value={form.salary}
                            onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                            className="input" />

                        <input placeholder="Tarifa hora" value={form.hourlyRate}
                            onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                            className="input" />

                        <input type="date" value={form.startDate}
                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />

                        <input type="date" value={form.endDate}
                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <div className="flex gap-2">
                            <button type="button" onClick={onClose}>Cancelar</button>
                            <button disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}