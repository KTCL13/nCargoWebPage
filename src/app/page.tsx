import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import dynamic from 'next/dynamic';

const Benefits = dynamic(() => import('@/components/landing/Benefits').then(mod => mod.Benefits), { ssr: false });
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => mod.HowItWorks), { ssr: false });
const Destinations = dynamic(() => import('@/components/landing/Destinations').then(mod => mod.Destinations), { ssr: false });
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => mod.CTASection), { ssr: false });
const Footer = dynamic(() => import('@/components/landing/Footer').then(mod => mod.Footer), { ssr: false });
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