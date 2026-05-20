import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cargos y Puestos de Trabajo | N-Cargo Admin',
    description:
        'Administra los cargos y puestos de trabajo en N-Cargo. Crea, edita y elimina posiciones laborales con título y descripción.',
    keywords: ['cargos empresa', 'puestos de trabajo', 'organigrama N-Cargo'],
    robots: { index: false, follow: false },
};

export default function CargosLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
