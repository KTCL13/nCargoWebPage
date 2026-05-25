"use client";

import dynamic from 'next/dynamic';

const Benefits = dynamic(() => import('@/components/landing/Benefits').then(mod => mod.Benefits), { ssr: false });
const HowItWorks = dynamic(() => import('@/components/landing/HowItWorks').then(mod => mod.HowItWorks), { ssr: false });
const Destinations = dynamic(() => import('@/components/landing/Destinations').then(mod => mod.Destinations), { ssr: false });
const CTASection = dynamic(() => import('@/components/landing/CTASection').then(mod => mod.CTASection), { ssr: false });
const Footer = dynamic(() => import('@/components/landing/Footer').then(mod => mod.Footer), { ssr: false });

export const LandingLazyWrapper = () => {
    return (
        <>
            <Benefits />
            <HowItWorks />
            <Destinations />
            <CTASection />
            <Footer />
        </>
    );
};
