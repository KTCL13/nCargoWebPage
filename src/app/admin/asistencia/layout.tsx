import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Control de Asistencia | N-Cargo Admin',
    description:
        'Bitácora de asistencia de empleados N-Cargo: monitoreo de entradas, salidas, horas trabajadas y cierre manual de jornadas activas.',
    keywords: ['asistencia empleados', 'control jornada', 'bitácora horaria', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function AsistenciaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
