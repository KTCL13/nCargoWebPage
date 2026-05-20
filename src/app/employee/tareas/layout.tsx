import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mis Tareas | N-Cargo Empleado',
    description:
        'Gestiona tus tareas asignadas en N-Cargo mediante un tablero Kanban. Actualiza estados, crea nuevas tareas y registra el progreso de tus actividades.',
    keywords: ['mis tareas N-Cargo', 'tablero Kanban', 'actividades empleado', 'gestión tareas'],
    robots: { index: false, follow: false },
};

export default function TareasLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
