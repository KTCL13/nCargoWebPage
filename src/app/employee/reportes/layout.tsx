import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mis Reportes de Productividad | N-Cargo Empleado',
    description:
        'Visualiza tus reportes personales de productividad: horas trabajadas por día, distribución de tareas completadas y acumulado mensual de asistencia.',
    keywords: ['reportes productividad', 'mis horas trabajadas', 'estadísticas empleado', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function EmployeeReportesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
