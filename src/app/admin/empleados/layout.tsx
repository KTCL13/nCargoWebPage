import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestión de Empleados | N-Cargo Admin',
    description:
        'Administra el directorio de empleados de N-Cargo: altas, bajas, edición de datos, asignación de roles y contratos laborales.',
    keywords: ['empleados N-Cargo', 'gestión RRHH', 'directorio empleados'],
    robots: { index: false, follow: false },
};

export default function EmpleadosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
