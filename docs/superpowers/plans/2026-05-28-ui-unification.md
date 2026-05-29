# UI Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar tokens hardcodeados, unificar el patrón de modales con detección de cambios sin guardar, y remover el sistema de navegación móvil duplicado (BottomNav).

**Architecture:** Se crean tres piezas compartidas — `useDirtyForm` (hook de detección), `ModalShell` (wrapper de modales), `AuthFormCard` (layout de auth pages). Cada modal del dashboard se migra a `ModalShell`. Las páginas de login/forgot/reset adoptan `AuthFormCard`. `BottomNav` se elimina por completo.

**Tech Stack:** Next.js 16 App Router, React 18, TypeScript, Tailwind CSS v4, Jest + ts-jest

---

## Mapa de archivos

| Acción | Archivo |
|---|---|
| Crear | `src/hooks/useDirtyForm.ts` |
| Crear | `src/hooks/__tests__/useDirtyForm.test.ts` |
| Crear | `src/components/ui/ModalShell.tsx` |
| Crear | `src/components/ui/AuthFormCard.tsx` |
| Eliminar | `src/components/layout/BottomNav.tsx` |
| Modificar | `src/components/layout/DashboardLayout.tsx` |
| Modificar | `src/hooks/useEmployeeModal.ts` |
| Modificar | `src/lib/admin/employees/useEmployeeForm.ts` |
| Modificar | `src/app/admin/empleados/page.tsx` |
| Modificar | `src/components/admin/employees/EmployeeModal.tsx` |
| Modificar | `src/components/admin/employees/ContractModal.tsx` |
| Modificar | `src/components/admin/cotizaciones/CotizacionesClient.tsx` |
| Modificar | `src/components/admin/contratos/ContratosClient.tsx` |
| Modificar | `src/components/admin/tasks/TaskTable.tsx` |
| Modificar | `src/components/employee/tareas/NewTaskModal.tsx` |
| Modificar | `src/components/employee/cotizaciones/OdooModal.tsx` |
| Modificar | `src/app/login/page.tsx` |
| Modificar | `src/app/forgot-password/page.tsx` |
| Modificar | `src/app/forgot-password/ForgotPasswordClient.tsx` |
| Modificar | `src/app/forgot-password/SuccessMessage.tsx` |
| Modificar | `src/app/reset-password/[token]/page.tsx` |
| Modificar | `src/app/admin/reports/_components/Charts.tsx` |
| Modificar | `src/app/admin/reports/_components/MetricCards.tsx` |
| Modificar | `src/components/employee/tareas/KanbanBoard.tsx` |
| Modificar | `src/components/employee/jornada/TimerRing.tsx` |
| Modificar | `src/components/contracts/ContractExportButtons.tsx` |

---

## Task 1: Hook `useDirtyForm`

**Files:**
- Create: `src/hooks/useDirtyForm.ts`
- Create: `src/hooks/__tests__/useDirtyForm.test.ts`

- [ ] **Step 1: Escribir el test que falla**

```typescript
// src/hooks/__tests__/useDirtyForm.test.ts
import { useDirtyForm } from '@/hooks/useDirtyForm'

describe('useDirtyForm', () => {
  it('returns false when initial equals current', () => {
    expect(useDirtyForm({ name: 'Carlos', age: 30 }, { name: 'Carlos', age: 30 })).toBe(false)
  })

  it('returns true when a field changes', () => {
    expect(useDirtyForm({ name: 'Carlos' }, { name: 'Maria' })).toBe(true)
  })

  it('returns false for equal nested objects', () => {
    expect(useDirtyForm({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false)
  })

  it('returns true for changed nested objects', () => {
    expect(useDirtyForm({ a: { b: 1 } }, { a: { b: 2 } })).toBe(true)
  })

  it('returns false for equal empty strings', () => {
    expect(useDirtyForm({ name: '' }, { name: '' })).toBe(false)
  })

  it('returns true when field goes from empty to filled', () => {
    expect(useDirtyForm({ name: '' }, { name: 'Carlos' })).toBe(true)
  })
})
```

- [ ] **Step 2: Verificar que falla**

```bash
npx jest src/hooks/__tests__/useDirtyForm.test.ts
```
Expected: FAIL — `Cannot find module '@/hooks/useDirtyForm'`

- [ ] **Step 3: Implementar el hook**

```typescript
// src/hooks/useDirtyForm.ts
export function useDirtyForm<T>(initial: T, current: T): boolean {
  return JSON.stringify(initial) !== JSON.stringify(current)
}
```

- [ ] **Step 4: Verificar que pasa**

```bash
npx jest src/hooks/__tests__/useDirtyForm.test.ts
```
Expected: PASS — 6 tests

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDirtyForm.ts src/hooks/__tests__/useDirtyForm.test.ts
git commit -m "feat: add useDirtyForm hook for modal dirty-state detection"
```

---

## Task 2: Componente `ModalShell`

**Files:**
- Create: `src/components/ui/ModalShell.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/ui/ModalShell.tsx
'use client'

import { useState } from 'react'

interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  cancelLabel?: string
  isDirty?: boolean
  maxWidth?: 'sm' | 'md' | 'lg'
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  cancelLabel = 'Cancelar',
  isDirty = false,
  maxWidth = 'md',
}: ModalShellProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!isOpen) return null

  const maxWidthClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[maxWidth]

  const handleClose = () => {
    if (isDirty) {
      setConfirmOpen(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setConfirmOpen(false)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className={`bg-white rounded-[var(--radius-xl)] shadow-xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col`}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start shrink-0">
          <div>
            <h2 className="font-titles text-xl font-extrabold text-[var(--color-foreground)]">{title}</h2>
            {subtitle && (
              <p className="font-subtitles text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-md)] border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors ml-4 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="btn-outline text-sm px-5 py-2.5"
          >
            {cancelLabel}
          </button>
          {footer}
        </div>
      </div>

      {/* Confirm discard dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-xl" aria-hidden="true">
              ⚠️
            </div>
            <h3 className="font-titles text-base font-extrabold text-[var(--color-foreground)] mb-2">
              ¿Descartar cambios?
            </h3>
            <p className="font-subtitles text-sm text-gray-500 mb-6">
              Tienes cambios sin guardar. Si cierras ahora los perderás.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="btn-outline text-sm px-5 py-2.5"
              >
                Seguir editando
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="btn-danger text-sm px-5 py-2.5"
              >
                Sí, descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/ModalShell.tsx
git commit -m "feat: add ModalShell component with dirty-state confirmation"
```

---

## Task 3: Componente `AuthFormCard`

**Files:**
- Create: `src/components/ui/AuthFormCard.tsx`

- [ ] **Step 1: Crear el componente**

```tsx
// src/components/ui/AuthFormCard.tsx
import Image from 'next/image'

interface AuthFormCardProps {
  title: string
  subtitle?: string
  imageSrc?: string
  children: React.ReactNode
}

export function AuthFormCard({
  title,
  subtitle,
  imageSrc = '/images/website/55.PNG',
  children,
}: AuthFormCardProps) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-center items-center overflow-hidden">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-nc-dark)]/85 via-[var(--color-nc-blue)]/55 to-[var(--color-nc-red)]/35" />
        <div className="relative z-10 text-center max-w-lg space-y-8 px-12">
          <h1 className="font-titles text-4xl text-white">
            Conectando Familias
            <br />a Través de Fronteras
          </h1>
          <p className="text-white/80 text-lg font-body">
            Gestiona envíos con <strong>N-Cargo</strong>.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <main className="flex-1 flex items-center justify-center bg-[#F9FAFB] px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h2 className="mb-2 text-center font-titles text-2xl text-[var(--color-nc-dark)]">
            {title}
          </h2>
          {subtitle && (
            <p className="font-subtitles text-sm text-gray-500 text-center mb-8">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-8" />}
          {children}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/AuthFormCard.tsx
git commit -m "feat: add AuthFormCard shared layout for auth pages"
```

---

## Task 4: Eliminar `BottomNav`

**Files:**
- Modify: `src/components/layout/DashboardLayout.tsx`
- Delete: `src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Limpiar `DashboardLayout`**

Abrir `src/components/layout/DashboardLayout.tsx`. Aplicar estos tres cambios exactos:

1. Eliminar la línea `import { BottomNav } from './BottomNav'`
2. En el `<div className="flex min-h-screen ...">`, cambiar `pb-[65px] md:pb-0` a nada (eliminar esos dos tokens del className)
3. Eliminar la línea `<BottomNav items={navItems} userRole={user?.role || ''} />`

El resultado completo del archivo debe quedar:

```tsx
'use client'

import { useState } from 'react'
import { Sidebar, NavItem } from './Sidebar'
import { Topbar } from './Topbar'
import { useAuth } from '@/context/AuthContext'

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle: string
  navItems: NavItem[]
  onReload?: () => void
}

export function DashboardLayout({
  children,
  pageTitle,
  navItems,
  onReload,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-[var(--color-nc-white)] text-gray-800 font-body">

      <Sidebar
        items={navItems}
        userRole={user?.role || ''}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="md:ml-[240px] flex flex-col flex-1 min-h-screen w-full relative">

        <Topbar
          pageTitle={pageTitle}
          userName={user?.name || ''}
          userRole={user?.role || ''}
          onLogout={logout}
          onReload={onReload}
          onMenuToggle={() => setSidebarOpen(o => !o)}
        />

        <main className="flex-1 p-4 sm:p-5 lg:p-8 flex flex-col gap-6">
          {children}
        </main>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Eliminar el archivo `BottomNav.tsx`**

```bash
rm src/components/layout/BottomNav.tsx
```

- [ ] **Step 3: Verificar TypeScript y tests**

```bash
npx tsc --noEmit && npm run test -- --passWithNoTests
```
Expected: sin errores de TypeScript, tests en verde

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/DashboardLayout.tsx
git rm src/components/layout/BottomNav.tsx
git commit -m "fix(nav): remove redundant BottomNav — sidebar is the single mobile navigation"
```

---

## Task 5: Migrar `EmployeeModal` → `ModalShell`

**Files:**
- Modify: `src/hooks/useEmployeeModal.ts`
- Modify: `src/lib/admin/employees/useEmployeeForm.ts`
- Modify: `src/app/admin/empleados/page.tsx`
- Modify: `src/components/admin/employees/EmployeeModal.tsx`

### 5a — Añadir `initialForm` al hook

- [ ] **Step 1: Actualizar `useEmployeeModal.ts`**

Abrir `src/hooks/useEmployeeModal.ts`. El archivo completo debe quedar:

```typescript
import { useState } from 'react'
import { Employee, Role, EmployeeFormState } from '@/types/admin/employees'
import { authFetch } from '@/lib/api-client/auth-fetch'

const EMPTY_EMPLOYEE_FORM: EmployeeFormState = {
  firstName: '', lastName: '', identificationNumber: '', identificationTypeId: '',
  email: '', password: '', phone: '', roleId: '', status: 'ACTIVE',
  jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '',
}

export function useEmployeeModal(
  roles: Role[],
  setForm: (f: EmployeeFormState) => void,
  setDupWarning: (w: any) => void,
  setSkipDupCheck: (b: boolean) => void,
) {
  const [showModal, setShowModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [initialForm, setInitialForm] = useState<EmployeeFormState>(EMPTY_EMPLOYEE_FORM)

  const openModal = async (emp?: Employee, view = false) => {
    setShowModal(true)
    setModalError('')
    setEditingId(emp?.id ?? null)
    setIsViewOnly(view)
    setDupWarning(null)
    setSkipDupCheck(false)

    setForm(EMPTY_EMPLOYEE_FORM)
    setInitialForm(EMPTY_EMPLOYEE_FORM)

    if (emp) {
      setModalLoading(true)
      try {
        const res = await authFetch(`/api/employees?id=${emp.id}`)
        if (!res.ok) throw new Error()
        const data = await res.json()
        const roleId = roles.find(r => r.name === data.roles?.[0])?.id?.toString() || ''
        const loaded: EmployeeFormState = {
          ...EMPTY_EMPLOYEE_FORM,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          identificationNumber: data.identificationNumber || '',
          identificationTypeId: data.identificationType?.id?.toString() || '',
          email: data.email || '',
          status: data.status || 'ACTIVE',
          phone: data.metadata?.phone || '',
          roleId,
          jobId: data.activeContract?.job?.id?.toString() || '',
          contractTypeId: data.activeContract?.contractType?.id?.toString() || '',
          salary: data.activeContract?.salary?.toString() || '',
          hourlyRate: data.activeContract?.hourlyRate?.toString() || '',
          startDate: data.activeContract?.startDate
            ? new Date(data.activeContract.startDate).toISOString().split('T')[0]
            : '',
          endDate: data.activeContract?.endDate
            ? new Date(data.activeContract.endDate).toISOString().split('T')[0]
            : '',
        }
        setForm(loaded)
        setInitialForm(loaded)
      } catch {
        setModalError('Error al cargar')
      } finally {
        setModalLoading(false)
      }
    }
  }

  return {
    showModal, setShowModal, modalLoading, setModalLoading,
    modalError, setModalError, editingId, isViewOnly,
    initialForm, openModal,
  }
}
```

- [ ] **Step 2: Actualizar `useEmployeeForm.ts`**

Abrir `src/lib/admin/employees/useEmployeeForm.ts`. Añadir `initialForm` al return:

```typescript
import { useEmployeeFormState } from '@/hooks/useEmployeeFormState'
import { useEmployeeModal } from '@/hooks/useEmployeeModal'
import { useEmployeeSubmit } from '@/hooks/useEmployeeSubmit'
import { Role } from '@/types/admin/employees'

export function useEmployeeForm(roles: Role[], fetchEmployees: () => void) {
  const { form, setForm } = useEmployeeFormState()

  const submit = useEmployeeSubmit(
    form, null, () => { }, () => { }, () => { }, fetchEmployees
  )

  const modal = useEmployeeModal(
    roles, setForm, submit.setDupWarning, submit.setSkipDupCheck
  )

  const submitLogic = useEmployeeSubmit(
    form, modal.editingId, modal.setModalError,
    modal.setModalLoading, modal.setShowModal, fetchEmployees
  )

  return {
    ...modal, form, setForm, ...submitLogic,
  }
}
```

- [ ] **Step 3: Pasar `initialForm` a `EmployeeModal` en `EmpleadosPage`**

En `src/app/admin/empleados/page.tsx`, la línea de destructuring del hook:

```typescript
const {
  showModal, setShowModal, modalLoading, modalError, editingId, isViewOnly, form, setForm,
  dupWarning, setDupWarning, setSkipDupCheck, openModal, handleSubmit
} = useEmployeeForm(roles, fetchEmployees)
```

Añadir `initialForm` al destructuring:

```typescript
const {
  showModal, setShowModal, modalLoading, modalError, editingId, isViewOnly, form, setForm,
  dupWarning, setDupWarning, setSkipDupCheck, openModal, handleSubmit, initialForm,
} = useEmployeeForm(roles, fetchEmployees)
```

Y en el JSX donde se usa `<EmployeeModal>`, añadir `initialForm={initialForm}`:

```tsx
<EmployeeModal
  showModal={showModal} setShowModal={setShowModal} isViewOnly={isViewOnly}
  editingId={editingId} form={form} setForm={setForm}
  initialForm={initialForm}
  identificationTypes={identificationTypes} roles={roles}
  jobs={jobs} contractTypes={contractTypes}
  modalLoading={modalLoading} modalError={modalError} handleSubmit={handleSubmit}
  dupWarning={dupWarning} setDupWarning={setDupWarning} setSkipDupCheck={setSkipDupCheck}
/>
```

- [ ] **Step 4: Editar `EmployeeModal.tsx` — cuatro cambios quirúrgicos**

El archivo tiene 275 líneas. Los campos del formulario interior (líneas 50–246 aproximadamente) NO cambian. Solo se tocan cuatro zonas:

**Cambio 1 — imports (líneas 1–4):** Añadir dos imports:
```tsx
import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'
```

**Cambio 2 — interfaz (líneas 6–23):** Añadir `initialForm` como prop:
```tsx
  initialForm: EmployeeFormState   // ← añadir después de "form: EmployeeFormState"
```

**Cambio 3 — inicio del componente:** Reemplazar desde `export function EmployeeModal({` hasta la línea `if (!showModal) return null` (líneas 25–48, incluido el `<div role="dialog">` opener y todo su `<div className="px-6...">` header) con:

```tsx
export function EmployeeModal({
  showModal, setShowModal, isViewOnly, editingId, form, setForm,
  initialForm, identificationTypes, roles, jobs, contractTypes,
  modalLoading, modalError, handleSubmit, dupWarning, setDupWarning, setSkipDupCheck,
}: EmployeeModalProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isDirty = useDirtyForm(initialForm, form)

  const title = isViewOnly ? 'Detalles del Empleado' : editingId ? 'Editar Empleado' : 'Añadir Empleado'
  const subtitle = isViewOnly
    ? `Viendo perfil de ${form.firstName} ${form.lastName}`
    : editingId ? `Modificando a ${form.firstName} ${form.lastName}` : 'Completa los datos con asterisco (*) para continuar'

  const handleClose = () => { setShowModal(false); setDupWarning(null); setSkipDupCheck(false) }

  return (
    <ModalShell
      isOpen={showModal}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      isDirty={!isViewOnly && isDirty}
      maxWidth="md"
      footer={
        !isViewOnly ? (
          <button type="submit" form="employee-modal-form" disabled={modalLoading}
            className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50">
            {modalLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : null}
            {editingId ? 'Actualizar empleado' : 'Registrar empleado'}
          </button>
        ) : undefined
      }
    >
      <form id="employee-modal-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
```

**Cambio 4 — footer del form (líneas 257–273, el bloque `{!isViewOnly && (<div className="pt-2 flex gap-3">...`))**:
Eliminar todo ese bloque de botones (los dos botones Cancelar + submit). El footer ahora lo gestiona `ModalShell`.

Cerrar el `</form>` y añadir `</ModalShell>` al final en lugar del doble `</div>` que cerraba el contenedor del modal.

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sin errores

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useEmployeeModal.ts src/lib/admin/employees/useEmployeeForm.ts \
        src/app/admin/empleados/page.tsx src/components/admin/employees/EmployeeModal.tsx
git commit -m "refactor: migrate EmployeeModal to ModalShell with dirty-state detection"
```

---

## Task 6: Migrar `ContractModal` → `ModalShell`

**Files:**
- Modify: `src/components/admin/employees/ContractModal.tsx`

El `ContractModal` siempre crea contratos nuevos (nunca edita), por lo que el `initial` siempre es vacío.

- [ ] **Step 1: Actualizar `ContractModal.tsx`**

Reemplazar el bloque de apertura del componente. El formulario interno no cambia. Solo cambia el wrapper:

```tsx
import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Job, ContractType } from '@/types/admin/employees'
import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'

// ... (toDateString, getMinStartDate, getMaxEndDate sin cambios) ...

const EMPTY_CONTRACT_FORM = {
  jobId: '', contractTypeId: '', salary: '', hourlyRate: '', startDate: '', endDate: '',
}

export function ContractModal({
  contractModalOpen, setContractModalOpen, contractModalEmpName,
  contractForm, setContractForm, jobs, contractTypes,
  contractModalLoading, contractModalError, handleContractSubmit
}: ContractModalProps) {
  // ... (isHourlyContractType, safeJobs, fechas, validaciones sin cambios) ...

  const isDirty = useDirtyForm(EMPTY_CONTRACT_FORM, {
    jobId: String(contractForm.jobId ?? ''),
    contractTypeId: String(contractForm.contractTypeId ?? ''),
    salary: String(contractForm.salary ?? ''),
    hourlyRate: String(contractForm.hourlyRate ?? ''),
    startDate: contractForm.startDate ?? '',
    endDate: contractForm.endDate ?? '',
  })

  const onFormSubmit = (e: React.FormEvent) => {
    if (dateValidationError) { e.preventDefault(); return }
    handleContractSubmit(e)
  }

  return (
    <ModalShell
      isOpen={contractModalOpen}
      onClose={() => setContractModalOpen(false)}
      title="Nuevo Contrato"
      subtitle={`Asignar cargo y salario a ${contractModalEmpName}`}
      isDirty={isDirty}
      maxWidth="md"
      footer={
        <button
          type="submit"
          form="contract-modal-form"
          disabled={contractModalLoading || !!dateValidationError}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50 flex items-center gap-2"
        >
          {contractModalLoading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
            : 'Crear Contrato'}
        </button>
      }
    >
      <form id="contract-modal-form" onSubmit={onFormSubmit} className="flex flex-col gap-5">
        {/* ── grid de campos sin cambios ── */}
        {/* ── banners de error sin cambios ── */}
      </form>
    </ModalShell>
  )
}
```

> **Nota:** El grid interno de campos (`jobId`, `contractTypeId`, `salaryRate`, fechas) y los banners de error se mantienen igual. Solo se eliminan el `<div role="dialog"...>` externo, el header con `✕`, y los botones del `<div className="pt-2 flex gap-3">` que reemplaza el `footer` prop.

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/employees/ContractModal.tsx
git commit -m "refactor: migrate ContractModal to ModalShell"
```

---

## Task 7: Migrar modal de `CotizacionesClient` → `ModalShell`

**Files:**
- Modify: `src/components/admin/cotizaciones/CotizacionesClient.tsx`

El modal de oficinas es inline (no es un componente separado). Añadir `initialOfficeForm` state y envolver con `ModalShell`.

Las variables reales del archivo son: `officeModal`/`setOfficeModal` (boolean), `editingOffice`/`setEditingOffice`, `officeForm`/`setOfficeForm`, `savingOffice`, `saveOffice()`, `openNewOffice()`, `openEditOffice(o)`.

- [ ] **Step 1: Añadir imports y estado inicial (línea ~162)**

```tsx
import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'
```

Junto a `const [officeForm, setOfficeForm] = useState(...)` (línea 164), añadir:
```tsx
const EMPTY_OFFICE_FORM = { name: '', address: '', latitude: '', longitude: '' }
const [initialOfficeForm, setInitialOfficeForm] = useState(EMPTY_OFFICE_FORM)
```

- [ ] **Step 2: Actualizar `openNewOffice` y `openEditOffice` (líneas 174–185)**

```tsx
const openNewOffice = () => {
  setEditingOffice(null)
  setOfficeForm(EMPTY_OFFICE_FORM)
  setInitialOfficeForm(EMPTY_OFFICE_FORM)   // ← añadir
  resetOfficeModal()
  setOfficeModal(true)
}
const openEditOffice = (o: Office) => {
  setEditingOffice(o)
  const current = { name: o.name, address: o.address, latitude: String(o.latitude), longitude: String(o.longitude) }
  setOfficeForm(current)
  setInitialOfficeForm(current)             // ← añadir
  setGeocodedDisplay(o.address)
  setGeocoding(false); setShowLocationPicker(false); setOfficeError('')
  setOfficeModal(true)
}
```

- [ ] **Step 3: Añadir `isOfficeDirty` y reemplazar el bloque del modal**

Añadir antes del return del componente:
```tsx
const isOfficeDirty = useDirtyForm(initialOfficeForm, officeForm)
```

Reemplazar el bloque `{officeModal && (<div className="fixed inset-0 z-50 ...">...</div>)}` (empieza en línea ~561, termina ~650) con:

```tsx
<ModalShell
  isOpen={officeModal}
  onClose={() => setOfficeModal(false)}
  title={editingOffice ? 'Editar Almacén' : 'Nuevo Almacén'}
  subtitle="Nombre y dirección son requeridos"
  isDirty={isOfficeDirty}
  maxWidth="md"
  footer={
    <button
      onClick={saveOffice}
      disabled={savingOffice}
      className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50"
    >
      {savingOffice ? '...' : 'Guardar'}
    </button>
  }
>
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre del almacén</label>
      <input type="text" placeholder="Ej. Almacén Miami" aria-label="Nombre del almacén"
        value={officeForm.name} onChange={e => setOfficeForm(f => ({ ...f, name: e.target.value }))}
        className="form-input w-full" />
    </div>

    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
      <div className="flex gap-2">
        <input type="text" placeholder="Ej. 1234 NW 72nd Ave, Miami, FL" aria-label="Dirección del almacén"
          value={officeForm.address}
          onChange={e => { setOfficeForm(f => ({ ...f, address: e.target.value })); setGeocodedDisplay('') }}
          onKeyDown={e => e.key === 'Enter' && geocodeOfficeAddress()}
          className="form-input flex-1" />
        <button onClick={geocodeOfficeAddress} disabled={geocoding || !officeForm.address.trim()}
          aria-label="Geocodificar dirección"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gray-900 text-white disabled:opacity-40 transition-opacity whitespace-nowrap">
          {geocoding ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
          {geocoding ? 'Buscando…' : 'Geocodificar'}
        </button>
      </div>
    </div>

    {/* Geocode result — sin cambios */}
    {geocodedDisplay && officeForm.latitude && officeForm.longitude && (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5">
          <MapPin size={12} className="text-green-600 shrink-0" /> Ubicación encontrada
        </p>
        <p className="text-xs text-green-700 leading-snug">{geocodedDisplay}</p>
        <p className="font-mono text-[10px] text-green-600">{parseFloat(officeForm.latitude).toFixed(5)}, {parseFloat(officeForm.longitude).toFixed(5)}</p>
        <button onClick={() => setShowLocationPicker(true)}
          className="mt-1 self-start text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-900 transition-colors">
          ¿No coincide? Ajustar en el mapa →
        </button>
      </div>
    )}

    {!geocodedDisplay && !officeForm.latitude && (
      <button onClick={() => setShowLocationPicker(true)}
        className="w-full text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors">
        🗺️ Seleccionar directamente en el mapa
      </button>
    )}

    {officeError && <p className="text-red-500 text-sm">{officeError}</p>}
  </div>
</ModalShell>
```

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/cotizaciones/CotizacionesClient.tsx
git commit -m "refactor: migrate CotizacionesClient office modal to ModalShell"
```

---

## Task 8: Migrar `ContratosClient` history modal → `ModalShell`

**Files:**
- Modify: `src/components/admin/contratos/ContratosClient.tsx`

Este modal es de solo lectura (historial). No necesita dirty-check. `cancelLabel="Cerrar"`, sin `footer`.

- [ ] **Step 1: Añadir import**

```tsx
import { ModalShell } from '@/components/ui/ModalShell'
```

- [ ] **Step 2: Reemplazar el modal inline**

Buscar el bloque en línea ~241:
```tsx
{historyOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    role="dialog" aria-modal="true" aria-labelledby="history-title"
  >
    <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
        ...header con ×...
      </div>
      ...export buttons + lista...
    </div>
  </div>
)}
```

Reemplazarlo por:

```tsx
<ModalShell
  isOpen={historyOpen}
  onClose={() => setHistoryOpen(false)}
  title="Historial de contratos"
  subtitle={historyEmpName}
  cancelLabel="Cerrar"
  maxWidth="lg"
>
  {/* Export buttons */}
  {historyEmpId !== null && user?.id && token && (
    <div className="pb-4 border-b border-gray-100 mb-4">
      <ContractExportButtons
        employeeId={historyEmpId}
        employeeName={historyEmpName}
        generatedBy={user.id}
        token={token}
      />
    </div>
  )}

  {/* Lista de contratos — sin cambios */}
  <div className="space-y-3">
    {historyLoading ? (
      <p className="text-center text-gray-400 py-8" aria-live="polite">Cargando...</p>
    ) : historyList.length === 0 ? (
      <p className="text-center text-gray-400 py-8">Sin contratos registrados</p>
    ) : (
      historyList.map((hc) => (
        // ── tarjetas de contrato sin cambios ──
      ))
    )}
  </div>
</ModalShell>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/contratos/ContratosClient.tsx
git commit -m "refactor: migrate ContratosClient history modal to ModalShell"
```

---

## Task 9: Migrar `TaskTable` delete modal → `ModalShell`

**Files:**
- Modify: `src/components/admin/tasks/TaskTable.tsx`

Este es un modal de confirmación destructiva (no edita datos existentes). Sin dirty-check. El `footer` es el botón "Sí, eliminar y notificar".

- [ ] **Step 1: Añadir import**

```tsx
import { ModalShell } from '@/components/ui/ModalShell'
```

- [ ] **Step 2: Reemplazar el modal inline**

Buscar el bloque en línea ~147:
```tsx
{taskToDelete?.employeeId ? (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white rounded-[var(--radius-xl)] shadow-2xl w-full max-w-md ...">
      ...header + textarea + buttons...
    </div>
  </div>
) : ...}
```

Reemplazar solo el bloque `div.fixed` (no el `ConfirmDialog` que sigue):

```tsx
{taskToDelete?.employeeId ? (
  <ModalShell
    isOpen={true}
    onClose={handleCloseDelete}
    title="Cancelar tarea asignada"
    cancelLabel="Volver"
    maxWidth="sm"
    footer={
      <button
        type="button"
        disabled={!cancelReason.trim()}
        onClick={handleConfirmDelete}
        className="btn-danger text-sm px-5 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sí, eliminar y notificar
      </button>
    }
  >
    <div className="space-y-4">
      <p className="text-sm text-gray-600 font-subtitles">
        Vas a eliminar la tarea <span className="font-bold text-gray-900">&ldquo;{taskToDelete.title}&rdquo;</span> asignada a{' '}
        <span className="font-bold text-gray-900">
          {taskToDelete.employee ? `${taskToDelete.employee.firstName} ${taskToDelete.employee.lastName}` : 'un empleado'}
        </span>.
        <br />
        <span className="text-red-500 font-semibold">El empleado recibirá una notificación y un correo con el motivo.</span>
      </p>
      <div>
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
          Motivo de cancelación <span className="text-red-500">*</span>
        </label>
        <textarea
          value={cancelReason}
          onChange={e => setCancelReason(e.target.value)}
          rows={3}
          className="form-input w-full resize-none"
          placeholder="Explica el motivo por el que se cancela esta tarea..."
        />
      </div>
    </div>
  </ModalShell>
) : (
  <ConfirmDialog
    isOpen={taskToDelete !== null}
    onClose={handleCloseDelete}
    onConfirm={handleConfirmDelete}
    title="¿Eliminar esta tarea?"
    description="Esta acción no se puede deshacer. La tarea será eliminada permanentemente del sistema."
    confirmText="Sí, eliminar"
    cancelText="Cancelar"
    variant="danger"
  />
)}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/tasks/TaskTable.tsx
git commit -m "refactor: migrate TaskTable delete modal to ModalShell"
```

---

## Task 10: Migrar `NewTaskModal` → `ModalShell`

**Files:**
- Modify: `src/components/employee/tareas/NewTaskModal.tsx`

- [ ] **Step 1: Reemplazar el contenido completo**

```tsx
import { ModalShell } from '@/components/ui/ModalShell'
import { useDirtyForm } from '@/hooks/useDirtyForm'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  setTitle: (t: string) => void
  description: string
  setDescription: (d: string) => void
  onSave: () => void
  saving: boolean
}

export function NewTaskModal({
  isOpen, onClose, title, setTitle, description, setDescription, onSave, saving,
}: NewTaskModalProps) {
  const isDirty = useDirtyForm(
    { title: '', description: '' },
    { title, description },
  )

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Tarea"
      subtitle="Agrega una tarea al tablero"
      isDirty={isDirty}
      maxWidth="sm"
      footer={
        <button
          onClick={onSave}
          disabled={!title.trim() || saving}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Agregar Tarea'}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
            Nombre de la tarea
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ej: Revisión de contratos"
            className="form-input"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-subtitles text-xs font-semibold text-[var(--color-nc-dark)]/70 uppercase tracking-wide">
            Descripción
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe brevemente la tarea…"
            className="form-input resize-none"
          />
        </div>
      </div>
    </ModalShell>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/employee/tareas/NewTaskModal.tsx
git commit -m "refactor: migrate NewTaskModal to ModalShell"
```

---

## Task 11: Migrar `OdooModal` → `ModalShell`

**Files:**
- Modify: `src/components/employee/cotizaciones/OdooModal.tsx`

Modal de búsqueda/selección — sin dirty-check.

- [ ] **Step 1: Reemplazar el contenido completo**

```tsx
import { ModalShell } from '@/components/ui/ModalShell'

interface OdooModalProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isSearching: boolean
  customers: any[]
  selectedCustomer: any | null
  setSelectedCustomer: (c: any | null) => void
  isSending: boolean
  error: string
  success: string
  onSend: () => void
}

export function OdooModal({
  isOpen, onClose, searchQuery, setSearchQuery, isSearching,
  customers, selectedCustomer, setSelectedCustomer,
  isSending, error, success, onSend,
}: OdooModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular Cliente Odoo"
      subtitle="Busca y selecciona el cliente para la cotización"
      maxWidth="md"
      footer={
        <button
          onClick={onSend}
          disabled={!selectedCustomer || isSending}
          className="btn-primary text-sm px-5 py-2.5 disabled:opacity-50 flex items-center gap-2"
        >
          {isSending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
            : 'Confirmar Envío'}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o CC..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input pl-10"
            autoFocus
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg" aria-hidden="true">🔍</span>
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--color-nc-blue)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
          {customers.length > 0 ? (
            customers.map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomer(customer)}
                className={`flex flex-col gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                  selectedCustomer?.id === customer.id
                    ? 'border-[var(--color-nc-blue)] bg-[var(--color-nc-blue)]/5'
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-subtitles font-bold text-sm text-gray-900">{customer.name}</span>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">ID: {customer.id}</span>
                </div>
                <div className="flex flex-col text-xs text-gray-500 font-subtitles">
                  <span>📧 {customer.email}</span>
                  <span>🆔 CC/NIT: {customer.vat}</span>
                </div>
              </button>
            ))
          ) : searchQuery.length >= 3 && !isSearching ? (
            <p className="py-10 text-center text-gray-600 font-subtitles text-sm">No se encontraron clientes que coincidan.</p>
          ) : !searchQuery ? (
            <p className="py-10 text-center text-gray-500 font-subtitles text-sm">Empieza a escribir para buscar...</p>
          ) : null}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl border border-red-100 font-subtitles">⚠️ {error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 text-xs p-3 rounded-xl border border-green-100 font-subtitles">✅ {success}</div>
        )}
      </div>
    </ModalShell>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/employee/cotizaciones/OdooModal.tsx
git commit -m "refactor: migrate OdooModal to ModalShell"
```

---

## Task 12: Auth page `login/page.tsx` → `AuthFormCard`

**Files:**
- Modify: `src/app/login/page.tsx`

- [ ] **Step 1: Reemplazar el contenido completo**

```tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { AuthFormCard } from "@/components/ui/AuthFormCard"

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [bgImage, setBgImage] = useState("/images/website/55.PNG")

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_STRAPI_URL
    if (!url) return
    fetch(`${url}/api/login-page?populate=*`)
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        const bg = json?.data?.Fondo_login?.url
        if (bg) setBgImage(url.replace(/\/$/, '') + bg)
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || "Credenciales incorrectas")

      const payload = JSON.parse(atob(json.accessToken.split(".")[1]))
      login({ user: { id: payload.id, name: json.name, email: json.email, role: json.role }, token: json.accessToken })

      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        fetch("/api/employee/me", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${json.accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ timezone: tz }),
        }).catch(() => {})
      }

      router.push(json.role === "ADMIN" ? "/admin/dashboard" : "/employee/jornada")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFormCard title="LOGIN" imageSrc={bgImage}>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input pr-12"
              required
            />
            <button
              type="button"
              aria-label="Mostrar u ocultar contraseña"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-gray-500 hover:text-[var(--color-nc-dark)] transition-colors"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm font-subtitles">{error}</p>
        )}

        <div className="text-right -mt-2">
          <Link href="/forgot-password" className="text-xs font-subtitles text-gray-500 hover:text-[var(--color-nc-red)] transition-colors">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 w-full disabled:opacity-50"
        >
          {loading ? "Cargando..." : "Iniciar sesión"}
        </button>
      </form>
    </AuthFormCard>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "refactor: migrate login page to AuthFormCard, remove hardcoded tokens"
```

---

## Task 13: Auth pages `forgot-password` → `AuthFormCard`

**Files:**
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/forgot-password/ForgotPasswordClient.tsx`
- Modify: `src/app/forgot-password/SuccessMessage.tsx`

- [ ] **Step 1: Reemplazar `forgot-password/page.tsx`**

```tsx
import { AuthFormCard } from "@/components/ui/AuthFormCard"
import ForgotPasswordClient from "./ForgotPasswordClient"

export const metadata = {
  title: "Recuperar Contraseña | N-Cargo",
  description: "Recupera tu contraseña de N-Cargo",
  robots: { index: true, follow: true },
}

export default function ForgotPasswordPage() {
  return (
    <AuthFormCard
      title="RECUPERAR CONTRASEÑA"
      subtitle="Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña."
    >
      <ForgotPasswordClient />
    </AuthFormCard>
  )
}
```

- [ ] **Step 2: Reemplazar `ForgotPasswordClient.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SuccessMessage = dynamic(() => import('./SuccessMessage'), {
  loading: () => <div className="text-center p-4 text-sm text-gray-500">Cargando...</div>,
})

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.'); return }
      setSent(true)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return <SuccessMessage />

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="form-input"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm font-subtitles">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary py-3 w-full mt-2 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Enviar enlace'}
      </button>

      <div className="text-center mt-4">
        <Link
          href="/login"
          className="text-xs font-subtitles font-semibold text-gray-500 hover:text-[var(--color-nc-red)] transition-colors uppercase tracking-wider"
        >
          ← Volver al login
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Leer y limpiar `SuccessMessage.tsx`**

Abrir `src/app/forgot-password/SuccessMessage.tsx` y reemplazar cualquier `style={{ fontFamily }}`, `#040626`, `#FF003B` por clases Tailwind con CSS variables. El contenido visual no cambia, solo los tokens.

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/forgot-password/page.tsx src/app/forgot-password/ForgotPasswordClient.tsx \
        src/app/forgot-password/SuccessMessage.tsx
git commit -m "refactor: migrate forgot-password to AuthFormCard, remove hardcoded tokens"
```

---

## Task 14: Auth page `reset-password` → `AuthFormCard`

**Files:**
- Modify: `src/app/reset-password/[token]/page.tsx`

- [ ] **Step 1: Reemplazar el contenido completo**

El archivo actual usa `style={{ fontFamily: "'Montserrat'" }}` y `bg-[#FF003B]`. El nuevo archivo usa `AuthFormCard` y clases globales:

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { AuthFormCard } from '@/components/ui/AuthFormCard'

export default function ResetPasswordPage() {
  const params = useParams()
  const token = params.token as string
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Ocurrió un error. Intenta de nuevo.'); return }
      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthFormCard title="CONTRASEÑA ACTUALIZADA">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div>
          <p className="font-subtitles text-sm text-gray-600">
            Tu contraseña fue actualizada. Redirigiendo al login...
          </p>
        </div>
      </AuthFormCard>
    )
  }

  return (
    <AuthFormCard title="NUEVA CONTRASEÑA" subtitle="Crea una contraseña segura para tu cuenta.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Nueva contraseña
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="form-input pr-12"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              aria-label="Mostrar contraseña"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-subtitles font-semibold text-gray-700 uppercase tracking-widest mb-1">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConf ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              className="form-input pr-12"
              placeholder="Repite la contraseña"
            />
            <button
              type="button"
              onClick={() => setShowConf(p => !p)}
              aria-label="Mostrar confirmación"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConf ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm font-subtitles">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary py-3 w-full mt-2 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar contraseña'}
        </button>

        <div className="text-center">
          <Link href="/login" className="text-xs font-subtitles text-gray-500 hover:text-[var(--color-nc-red)] transition-colors uppercase tracking-wider">
            ← Volver al login
          </Link>
        </div>
      </form>
    </AuthFormCard>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/reset-password/\[token\]/page.tsx
git commit -m "refactor: migrate reset-password to AuthFormCard, remove hardcoded tokens"
```

---

## Task 15: Token cleanup en componentes del dashboard

**Files:**
- Modify: `src/app/admin/reports/_components/Charts.tsx`
- Modify: `src/app/admin/reports/_components/MetricCards.tsx`
- Modify: `src/components/employee/tareas/KanbanBoard.tsx`
- Modify: `src/components/employee/jornada/TimerRing.tsx`
- Modify: `src/components/contracts/ContractExportButtons.tsx`

Los SVG no admiten `var(--color-*)` como atributos directos (`fill="#FF003B"`), pero sí funcionan como valores CSS inline con `style={{ fill: 'var(--color-nc-red)' }}`.

Tabla de sustituciones:

| Hardcode | Reemplazar por |
|---|---|
| `#FF003B` o `#E8002E` | `var(--color-nc-red)` |
| `#040626` | `var(--color-nc-dark)` |
| `#0C1E8C` | `var(--color-nc-blue)` |
| `fill="#FF003B"` (SVG attr) | `style={{ fill: 'var(--color-nc-red)' }}` |
| `stroke="#0C1E8C"` (SVG attr) | `style={{ stroke: 'var(--color-nc-blue)' }}` |
| `stopColor="#FF003B"` (SVG attr) | `style={{ stopColor: 'var(--color-nc-red)' }}` |
| `style={{ fontFamily: "'League Spartan'..." }}` | eliminar (usar clase `font-titles`) |
| `style={{ fontFamily: "'Poppins'..." }}` | eliminar (usar clase `font-body`) |

- [ ] **Step 1: Limpiar `Charts.tsx`**

Abrir `src/app/admin/reports/_components/Charts.tsx`. Buscar con `grep -n "#040626\|#FF003B\|#0C1E8C"`. Para cada ocurrencia, aplicar la tabla de sustituciones de arriba.

- [ ] **Step 2: Limpiar `MetricCards.tsx`**

Ídem con `src/app/admin/reports/_components/MetricCards.tsx`.

- [ ] **Step 3: Limpiar `KanbanBoard.tsx`**

Ídem con `src/components/employee/tareas/KanbanBoard.tsx`.

- [ ] **Step 4: Limpiar `TimerRing.tsx`**

En `src/components/employee/jornada/TimerRing.tsx`, las propiedades `stopColor`, `stroke`, `fill` en SVG deben moverse a `style={{...}}`:

```tsx
// Antes:
<stop offset="0%" stopColor="#FF003B" />
// Después:
<stop offset="0%" style={{ stopColor: 'var(--color-nc-red)' }} />

// Antes:
<stop offset="100%" stopColor="#0C1E8C" />
// Después:
<stop offset="100%" style={{ stopColor: 'var(--color-nc-blue)' }} />
```

- [ ] **Step 5: Limpiar `ContractExportButtons.tsx`**

```tsx
// SVG icon (rect + path):
// Antes:
<rect x="3" y="2" width="13" height="17" rx="2" fill="#FF003B" opacity="0.9" />
// Después:
<rect x="3" y="2" width="13" height="17" rx="2" style={{ fill: 'var(--color-nc-red)' }} opacity="0.9" />
```

- [ ] **Step 6: Verificar que no quedan hardcodes en los archivos modificados**

```bash
grep -n "#040626\|#FF003B\|#0C1E8C\|#E8002E\|style.*League Spartan\|style.*Poppins\|style.*Montserrat" \
  src/app/admin/reports/_components/Charts.tsx \
  src/app/admin/reports/_components/MetricCards.tsx \
  src/components/employee/tareas/KanbanBoard.tsx \
  src/components/employee/jornada/TimerRing.tsx \
  src/components/contracts/ContractExportButtons.tsx
```
Expected: sin output

- [ ] **Step 7: Verificar TypeScript y tests**

```bash
npx tsc --noEmit && npm run test
```
Expected: sin errores de TypeScript, todos los tests pasan

- [ ] **Step 8: Commit final**

```bash
git add src/app/admin/reports/_components/Charts.tsx \
        src/app/admin/reports/_components/MetricCards.tsx \
        src/components/employee/tareas/KanbanBoard.tsx \
        src/components/employee/jornada/TimerRing.tsx \
        src/components/contracts/ContractExportButtons.tsx
git commit -m "refactor: replace hardcoded brand tokens with CSS variables in dashboard components"
```

---

## Verificación final

```bash
# 1. TypeScript limpio
npx tsc --noEmit

# 2. Sin imports de BottomNav
grep -r "BottomNav" src/

# 3. Sin hardcodes en auth pages
grep -rn "#040626\|#FF003B\|#0C1E8C\|style.*fontFamily" \
  src/app/login/ src/app/forgot-password/ src/app/reset-password/

# 4. Tests en verde
npm run test

# 5. ESLint
npm run lint
```

Expected en todos: sin output o errores.
