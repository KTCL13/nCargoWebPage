'use client'
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Destinations } from '@/components/landing/Destinations';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

export default function LandingPage() {
    useRevealOnScroll();

    return (
        <>
            <Navbar />
            <main id="main-content" className="min-h-screen font-body" tabIndex={-1}>
                <Hero />
                <Benefits />
                <HowItWorks />
                <Destinations />
                <CTASection />
            </main>
            <Footer />
        </>
    );
}