import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Benefits } from '@/components/landing/Benefits';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Destinations } from '@/components/landing/Destinations';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from '@/components/landing/Footer';
import { ScrollReveal } from '@/components/layout/ScrollReveal';

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