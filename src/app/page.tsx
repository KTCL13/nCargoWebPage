import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { LandingLazyWrapper } from '@/components/landing/LandingLazyWrapper';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

export const metadata: Metadata = {
    title: 'N-Cargo | Envíos Internacionales USA · Conectando Familias',
    description:
        'N-Cargo conecta familias a través de fronteras. Envíos confiables desde Estados Unidos a Latinoamérica. Cotiza, rastrea y gestiona tus paquetes en línea.',
    keywords: ['envíos internacionales', 'carga USA', 'N-Cargo', 'paquetería', 'logística'],
    openGraph: {
        title: 'N-Cargo | Envíos Internacionales USA',
        description: 'Gestiona envíos desde Estados Unidos a Latinoamérica con N-Cargo.',
        type: 'website',
    },
};

export default function LandingPage() {
    return (
        <ScrollReveal>
            <Navbar />
            <main id="main-content" className="min-h-screen" tabIndex={-1}>
                <Hero />
                <LandingLazyWrapper />
            </main>
        </ScrollReveal>
    );
}