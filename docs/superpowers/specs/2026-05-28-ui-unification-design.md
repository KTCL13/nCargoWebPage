# UI Unification — Design Spec

**Date:** 2026-05-28  
**Branch:** front2  
**Status:** Approved

---

## Objetivo

Eliminar tres antipatrones en la UI de N-Cargo:

1. **Inconsistencia visual** entre módulos de login, admin y employee (tokens hardcodeados, FONTS/CLASSES locales, `style={{ fontFamily }}` inline).
2. **Modales sin botón Cancelar estándar** — algunos no tienen Cancelar, ninguno protege contra pérdida de cambios sin guardar.
3. **Doble sistema de navegación en móvil** — `BottomNav` fijo + `Sidebar` vía hamburger coexisten (antipatrón UX). Solo debe quedar el Sidebar.

---

## Decisiones de diseño

| Pregunta | Decisión |
|---|---|
| Dirección de unificación | Tokens + Componentes compartidos (opción C) |
| Comportamiento de Cancelar | Confirmación si hay cambios sin guardar (`isDirty`) |
| Navegación móvil | Eliminar BottomNav; único acceso vía hamburger → Sidebar |

---

## Componentes nuevos

### `src/components/ui/AuthFormCard.tsx`

Layout de dos columnas reutilizado por todas las páginas de autenticación.

**Props:**
```typescript
interface AuthFormCardProps {
  title: string
  subtitle?: string
  imageSrc?: string   // default: '/images/website/55.PNG'
  children: React.ReactNode
}
```

**Estructura interna:**
- Panel izquierdo (oculto en móvil): imagen de fondo + overlay degradado `from-[var(--color-nc-dark)]/85 via-[var(--color-nc-blue)]/55 to-[var(--color-nc-red)]/35` + texto "Conectando Familias…"
- Panel derecho: fondo `bg-[#F9FAFB]`, card centrada `max-w-[400px]`, título con `font-titles`, children

No contiene lógica de formulario ni estado. Es exclusivamente layout.

---

### `src/components/ui/ModalShell.tsx`

Envuelve todos los modales del dashboard con cabecera, área scrollable y pie estandarizados.

**Props:**
```typescript
interface ModalShellProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer: React.ReactNode        // slot para botón de acción primaria
  isDirty?: boolean              // default false — activa confirmación al cancelar
  maxWidth?: 'sm' | 'md' | 'lg' // default 'md' (max-w-lg)
}
```

**Comportamiento:**
- `isDirty === false`: Cancelar y ✕ llaman `onClose` directamente.
- `isDirty === true`: Cancelar y ✕ muestran diálogo interno "¿Descartar cambios?" con botones "Seguir editando" y "Sí, descartar". Solo "Sí, descartar" llama `onClose`.
- Click en overlay llama a la misma lógica que Cancelar (con dirty-check si corresponde).
- El diálogo de confirmación se renderiza dentro del propio `ModalShell` (sin dependencia de `ConfirmDialog` externo).

**Estructura visual:**
```
┌─────────────────────────────────────┐
│ Título               [subtítulo]  ✕ │  ← header, border-bottom
├─────────────────────────────────────┤
│                                     │
│   children (overflow-y-auto)        │  ← área scrollable
│                                     │
├─────────────────────────────────────┤
│              [Cancelar]  [footer]   │  ← pie, border-top
└─────────────────────────────────────┘
```

---

### `src/hooks/useDirtyForm.ts`

Hook minimalista para detectar cambios sin guardar.

**Firma:**
```typescript
function useDirtyForm<T>(initial: T, current: T): boolean
```

**Implementación:** `JSON.stringify(initial) !== JSON.stringify(current)`. No gestiona estado propio; cada modal continúa usando su propio `useState`.

**Uso:**
```typescript
const isDirty = useDirtyForm(initialForm, form)
// pasar isDirty a ModalShell
```

---

## Archivos modificados

### Auth pages — adoptan `AuthFormCard` + eliminan hardcodes

| Archivo | Cambio |
|---|---|
| `src/app/login/page.tsx` | Eliminar FONTS, CLASSES, SafeImage, layout inline. Usar `<AuthFormCard title="LOGIN">` |
| `src/app/forgot-password/page.tsx` | Ídem. Mover subtitle al prop de AuthFormCard |
| `src/app/forgot-password/ForgotPasswordClient.tsx` | Eliminar FONTS/CLASSES locales. Usar `form-input`, `btn-primary` |
| `src/app/forgot-password/SuccessMessage.tsx` | Eliminar hardcodes de color/fuente |
| `src/app/reset-password/[token]/page.tsx` | Eliminar `style={{ fontFamily }}`, bg-[#FF003B]. Usar AuthFormCard + clases globales |

**Regla:** Ningún archivo de auth puede tener `style={{ fontFamily }}`, `#040626`, `#FF003B`, `#0C1E8C` literales ni `FONTS`/`CLASSES` locales. Solo CSS variables y clases globales del proyecto.

### Modales del dashboard — adoptan `ModalShell` + `useDirtyForm`

| Archivo | Modal |
|---|---|
| `src/components/admin/employees/EmployeeModal.tsx` | Empleado (crear/editar) |
| `src/components/admin/employees/ContractModal.tsx` | Contrato |
| `src/components/admin/cotizaciones/CotizacionesClient.tsx` | Almacén (inline modal) |
| `src/components/admin/contratos/ContratosClient.tsx` | Edición de contrato |
| `src/components/employee/tareas/NewTaskModal.tsx` | Nueva tarea |
| `src/components/employee/cotizaciones/OdooModal.tsx` | Odoo |

Cada modal: reemplaza su overlay/contenedor actual por `<ModalShell>`, pasa `isDirty={useDirtyForm(initial, form)}`, mueve los botones de acción al prop `footer`.

> **Nota de implementación:** Antes de comenzar, ejecutar `grep -rn "fixed inset-0\|role=\"dialog\"\|showModal\|isOpen" src/components --include="*.tsx"` para detectar modales adicionales (ej. `TaskTable.tsx`) que no estén en esta lista.

### Token cleanup — componentes del dashboard con hardcodes menores

| Archivo | Token problemático |
|---|---|
| `src/app/admin/reports/_components/Charts.tsx` | `#040626`, `#FF003B` |
| `src/app/admin/reports/_components/MetricCards.tsx` | `#040626` |
| `src/components/employee/tareas/KanbanBoard.tsx` | `#040626` |
| `src/components/employee/reportes/HoursChart.tsx` | colores de chart hardcodeados |
| `src/components/employee/jornada/TimerRing.tsx` | colores SVG hardcodeados |
| `src/components/contracts/ContractExportButtons.tsx` | colores |

Reemplazar por CSS variables o constantes de color centralizadas.

### Navegación móvil — eliminar BottomNav

| Archivo | Cambio |
|---|---|
| `src/components/layout/DashboardLayout.tsx` | Eliminar import BottomNav, eliminar `<BottomNav>` del JSX, eliminar `pb-[65px] md:pb-0` del wrapper div |
| `src/components/layout/BottomNav.tsx` | **Eliminar** el archivo |

En móvil queda un único sistema de navegación: hamburger en Topbar → Sidebar deslizable.

---

## Invariantes de calidad

- `npx tsc --noEmit` sin errores tras los cambios.
- `npm run lint` sin errores ESLint.
- `npm run test` — todos los tests existentes pasan (los cambios son puramente visuales/de layout, no tocan lógica de negocio).
- Ningún archivo puede importar de `BottomNav` tras la eliminación.
- Ningún archivo de auth puede tener colores hexadecimales hardcodeados (lint rule manual durante review).

---

## Fuera de alcance

- Rediseño visual (colores, tipografía, espaciados) — solo se normaliza lo que ya existe.
- Nuevas páginas o rutas.
- Cambios en lógica de negocio o APIs.
- Animaciones o transiciones nuevas más allá de las existentes.
