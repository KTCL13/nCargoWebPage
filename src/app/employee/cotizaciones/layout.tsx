import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cotizador de Envíos | N-Cargo Empleado',
    description:
        'Calcula el costo de envío de paquetes desde Estados Unidos a Latinoamérica. Introduce peso, dimensiones y destino para obtener una cotización en tiempo real.',
    keywords: ['cotizador envíos', 'calcular tarifa carga', 'N-Cargo cotización', 'envío internacional'],
    robots: { index: false, follow: false },
};

export default function CotizacionesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
