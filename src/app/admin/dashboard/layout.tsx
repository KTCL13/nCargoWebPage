import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard Administrativo | N-Cargo',
    description:
        'Vista general de operaciones N-Cargo: empleados activos, tareas en proceso, jornadas registradas y cotizaciones. Acceso rápido a todos los módulos administrativos.',
    keywords: ['dashboard admin', 'panel control', 'KPIs operaciones', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
