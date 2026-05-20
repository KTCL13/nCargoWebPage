import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nueva Contraseña | N-Cargo',
    description:
        'Crea una nueva contraseña segura para tu cuenta N-Cargo. Completa el proceso de restablecimiento usando el enlace recibido en tu correo.',
    keywords: ['nueva contraseña', 'reset password', 'N-Cargo'],
    robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
