import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'KPIs de Empleados | N-Cargo Admin',
    description:
        'Indicadores de rendimiento individual de empleados N-Cargo: horas trabajadas, tareas completadas, tendencias temporales y comparativas por período.',
    keywords: ['KPIs empleados', 'rendimiento individual', 'métricas equipo', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
