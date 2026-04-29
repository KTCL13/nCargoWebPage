'use client'
import Link from 'next/link';
import { useState, useEffect, useId } from 'react';
import { Icons } from '@/components/ui/Icons';

const NAV_LINKS = [
    { label: 'Tienda', href: 'https://ncargousa.odoo.com/' },
    { label: 'Rastreo', href: 'https://ncargousa.odoo.com/' },
    { label: 'Servicios', href: 'https://ncargousa.odoo.com/' },
    { label: 'Encuéntranos', href: 'https://ncargousa.odoo.com/' },
    { label: '¿Quiénes Somos?', href: 'https://ncargousa.odoo.com/' },
] as const;

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuId = useId();

    // Manejo del scroll
    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cerrar menú con ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    const navStyle = isScrolled
        ? 'bg-[var(--color-foreground)]/98 border-white/10 shadow-lg shadow-black/30'
        : 'bg-[var(--color-foreground)]/90 border-transparent backdrop-blur-md';

    return (
        <header role="banner">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white text-black px-4 py-2 rounded z-50 outline-none">
                Saltar al contenido
            </a>

            <nav
                aria-label="Navegación principal"
                className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 lg:px-[6%] h-[80px] transition-all duration-300 border-b ${navStyle}`}
            >
                <Link href="/" aria-label="N-Cargo" className="rounded-[var(--radius-md)] focus-visible:ring-3 focus-visible:ring-[var(--color-primary)] outline-none">
                    <img src="/images/logos/77.PNG" alt="N-Cargo" className="h-[60px] w-auto object-contain rounded-[var(--radius-md)]" width={120} height={60} />
                </Link>

                <ul className="hidden md:flex items-center gap-1">
                    {NAV_LINKS.map(({ label, href }) => (
                        <li key={label}>
                            <Link
                                href={href}
                                className="font-subtitles text-sm font-medium text-white/80 px-3 py-2 rounded-[var(--radius-md)] hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-3 focus-visible:ring-[var(--color-secondary)] outline-none"
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="flex items-center gap-4">
                    <Link
                        href="/login"
                        className="btn-primary hidden md:inline-flex text-sm px-5 py-2.5"
                    >
                        <Icons.User className="w-4 h-4" aria-hidden="true" />
                        Login
                    </Link>

                    <button
                        type="button"
                        onClick={() => setMobileOpen(prev => !prev)}
                        aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                        aria-expanded={mobileOpen}
                        aria-controls={menuId}
                        className="md:hidden w-10 h-10 flex items-center justify-center rounded-[var(--radius-md)] text-white hover:bg-white/10 focus-visible:ring-3 focus-visible:ring-[var(--color-secondary)] outline-none"
                    >
                        {mobileOpen ? (
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" /></svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        )}
                    </button>
                </div>
            </nav>

            <div
                id={menuId}
                role="dialog"
                aria-modal="true"
                aria-label="Menú móvil"
                className={`fixed inset-0 z-40 md:hidden bg-[var(--color-foreground)]/97 backdrop-blur-md flex flex-col pt-[80px] transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                <nav className="flex flex-col gap-1 p-4" aria-label="Enlaces del menú móvil">
                    {/* Menú Móvil - CAMBIADO: key={label} */}
                    {NAV_LINKS.map(({ label, href }) => (
                        <Link
                            key={label}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className="font-subtitles text-base font-medium text-white/80 px-4 py-3 rounded-[var(--radius-md)] hover:text-white hover:bg-white/10 transition-colors focus-visible:ring-3 focus-visible:ring-[var(--color-secondary)] outline-none"
                        >
                            {label}
                        </Link>
                    ))}

                    <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="btn-primary mt-4 w-full justify-center text-sm"
                    >
                        <Icons.User className="w-4 h-4" aria-hidden="true" />
                        Iniciar sesión
                    </Link>
                </nav>
            </div>
        </header>
    );
};
