import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Destinations } from '@/components/landing/Destinations';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
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
                <Benefits />
                <HowItWorks />
                <Destinations />
                <CTASection />
            </main>
            <Footer />
        </ScrollReveal>
    );
}