import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Configuración del Sistema | N-Cargo Admin',
    description:
        'Configura tarifas de envío por país, variables de nómina, constantes de cotización y proveedores de transporte en N-Cargo.',
    keywords: ['configuración N-Cargo', 'tarifas envío', 'variables nómina', 'transportadora'],
    robots: { index: false, follow: false },
};

export default function ConfiguracionLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
