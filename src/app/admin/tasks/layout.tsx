import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestión de Tareas | N-Cargo Admin',
    description:
        'Control y asignación de tareas al equipo N-Cargo: crea tareas individuales o masivas, reasigna responsables, monitorea estados y limpia tareas vencidas.',
    keywords: ['gestión tareas', 'asignación actividades', 'control equipo', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function TasksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
