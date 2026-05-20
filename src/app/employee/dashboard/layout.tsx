import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mi Dashboard | N-Cargo Empleado',
    description:
        'Panel principal del empleado en N-Cargo. Redirige automáticamente al módulo de jornada laboral.',
    robots: { index: false, follow: false },
};

export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
