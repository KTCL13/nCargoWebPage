import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portal del Empleado | N-Cargo',
    description:
        'Accede al portal de empleados N-Cargo para gestionar tu jornada laboral, tareas asignadas, envíos de casilleros y reportes de productividad.',
    keywords: ['portal empleado N-Cargo', 'jornada laboral', 'mis tareas', 'mis envíos'],
    robots: { index: false, follow: false, nocache: true },
};

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
