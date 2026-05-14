import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Reportes y Analítica | N-Cargo Admin',
    description:
        'Analítica operacional de N-Cargo: rendimiento de empleados, distribución de carga de trabajo, alertas de equipo y exportación de reportes a CSV.',
    keywords: ['reportes N-Cargo', 'analítica operacional', 'KPIs empleados', 'rendimiento equipo'],
    robots: { index: false, follow: false },
};

export default function ReportesAdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
