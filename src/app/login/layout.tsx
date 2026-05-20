import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Iniciar Sesión | N-Cargo',
    description:
        'Accede a tu cuenta N-Cargo para gestionar envíos, cotizaciones y operaciones de carga internacional desde Estados Unidos.',
    keywords: ['login N-Cargo', 'acceso plataforma', 'gestión envíos'],
    robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
