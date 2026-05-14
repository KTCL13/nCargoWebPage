import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Panel Administrativo | N-Cargo',
    description:
        'Panel de administración de N-Cargo. Gestiona empleados, contratos, envíos, cotizaciones, reportes y configuración del sistema.',
    keywords: ['admin N-Cargo', 'panel administrativo', 'gestión empresarial'],
    robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
