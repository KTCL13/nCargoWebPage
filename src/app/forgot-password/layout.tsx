import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Recuperar Contraseña | N-Cargo',
    description:
        'Restablece tu contraseña de N-Cargo. Ingresa tu correo electrónico y recibirás un enlace para crear una nueva contraseña.',
    keywords: ['recuperar contraseña', 'reset password', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
