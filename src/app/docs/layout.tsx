import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Documentación API | N-Cargo',
    description:
        'Referencia interactiva de la API REST de N-Cargo. Explora endpoints de empleados, envíos, cotizaciones, contratos y autenticación.',
    keywords: ['API N-Cargo', 'Swagger', 'documentación REST', 'endpoints'],
    robots: { index: false, follow: false },
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
