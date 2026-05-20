import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mis Envíos de Casillero | N-Cargo Empleado',
    description:
        'Consulta y gestiona los envíos de casillero asignados. Actualiza números de rastreo y sigue el estado de cada paquete en tiempo real.',
    keywords: ['mis envíos', 'casillero N-Cargo', 'seguimiento paquetes', 'tracking'],
    robots: { index: false, follow: false },
};

export default function EmployeeEnviosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
