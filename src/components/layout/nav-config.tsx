// src/components/layout/nav-config.tsx
// Centraliza los links del sidebar.
// Filtra automáticamente según el rol del usuario.

import { NavItem } from './Sidebar'

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: <span aria-hidden="true">🏠</span>,
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    label: 'Gestión de empleados',
    href: '/admin/empleados',
    icon: <span aria-hidden="true">👥</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Asistencia',
    href: '/admin/asistencia',
    icon: <span aria-hidden="true">⏱️</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Contratos',
    href: '/admin/contratos',
    icon: <span aria-hidden="true">📄</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Tareas',
    href: '/admin/tasks',
    icon: <span aria-hidden="true">📋</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Cargos',
    href: '/admin/contratos/cargos',
    icon: <span aria-hidden="true">💼</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Envíos',
    href: '/admin/envios',
    icon: <span aria-hidden="true">📦</span>,
    roles: ['ADMIN', 'EMPLOYEE'],
  },
  {
    label: 'Cotizaciones',
    href: '/admin/cotizaciones',
    icon: <span aria-hidden="true">💲</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Métricas',
    href: '/admin/reportes',
    icon: <span aria-hidden="true">📊</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Configuración',
    href: '/admin/configuracion',
    icon: <span aria-hidden="true">⚙️</span>,
    roles: ['ADMIN'],
  },
  {
    label: 'Jornada laboral',
    href: '/employee/jornada',
    icon: <span aria-hidden="true">⏱️</span>,
    roles: ['EMPLOYEE'],
    section: 'Tiempos y Tareas',
  },
  {
    label: 'Mis tareas',
    href: '/employee/tareas',
    icon: <span aria-hidden="true">✅</span>,
    roles: ['EMPLOYEE'],
    section: 'Tiempos y Tareas',
  },
  {
    label: 'Reportes',
    href: '/employee/reportes',
    icon: <span aria-hidden="true">📊</span>,
    roles: ['EMPLOYEE'],
    section: 'Reportes y Analítica',
  },
  {
    label: 'Cotizaciones',
    href: '/employee/cotizaciones',
    icon: <span aria-hidden="true">💲</span>,
    roles: ['EMPLOYEE'],
    section: 'Cotizaciones',
  },
]