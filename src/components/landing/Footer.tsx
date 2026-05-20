// src/components/landing/Footer.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ── Constantes de Estilos ───────────────────────────────────── */
const LINK_STYLES = `
    text-slate-100 hover:text-blue-400
    transition-colors duration-150
    focus-visible:outline-none focus-visible:ring-[3px]
    focus-visible:ring-blue-400 focus-visible:rounded-sm
    inline-block p-2 -mx-2
`;

const CONTACT_ICON_STYLES = "w-5 h-5 mt-0.5 shrink-0 text-blue-400";

/* ── Componentes de UI ───────────────────────────────────────── */

// Icono de Red Social
const SocialIcon: React.FC<{ href: string; path: string; label: string; hoverClass?: string }> = ({
    href, path, label, hoverClass = 'hover:text-white'
}) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`N-Cargo en ${label}`}
        className={`
            w-9 h-9 flex items-center justify-center rounded-[var(--radius-md)]
            bg-white/5 border border-white/10 text-slate-100
            ${hoverClass} transition-all duration-200
            hover:bg-white/10 hover:border-white/25 hover:scale-110
            focus-visible:outline-none focus-visible:ring-[3px]
            focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2
            focus-visible:ring-offset-[var(--color-foreground)]
        `}
    >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d={path} />
        </svg>
    </a>
);

// Componente reutilizable para columnas de enlaces (Servicios/Empresa)
const FooterLinks: React.FC<{ title: string; links: string[] }> = ({ title, links }) => (
    <nav aria-label={title}>
        <h3 className="text-white font-subtitles font-bold mb-6 text-sm uppercase tracking-wider">
            {title}
        </h3>
        <ul className="space-y-3 text-sm list-none p-0 m-0">
            {links.map((item) => (
                <li key={item}>
                    <a href="#" className={LINK_STYLES}>{item}</a>
                </li>
            ))}
        </ul>
    </nav>
);

/* ── Datos ──────────────────────────────────────────────────── */
const SOCIAL_LINKS = [
    { label: 'Instagram', href: 'https://instagram.com', hoverClass: 'hover:text-pink-400', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
    { label: 'Facebook', href: 'https://facebook.com', hoverClass: 'hover:text-blue-400', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
    { label: 'WhatsApp', href: 'https://wa.me/', hoverClass: 'hover:text-green-400', path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' },
    { label: 'TikTok', href: 'https://tiktok.com', hoverClass: 'hover:text-white', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
];

const DATA_LINKS = {
    services: ['Envíos USA → Colombia', 'Envíos USA → México', 'Casillero Internacional', 'Rastreo de paquetes', 'Consolidación de paquetes', 'Seguro de carga'],
    company: ['Sobre nosotros', 'Blog', 'Preguntas frecuentes', 'Términos y condiciones', 'Política de privacidad', 'Trabaja con nosotros'],
};

const PAYMENT_METHODS = [
    { label: 'VISA', color: 'text-slate-100' },
    { label: 'Mastercard', color: 'text-slate-100' },
    { label: 'AMEX', color: 'text-slate-100' },
    { label: 'PayPal', color: 'text-slate-100' },
    { label: 'Nequi', color: 'bg-[var(--color-secondary)] text-white px-1.5 py-0.5 rounded-sm' },
    { label: 'Daviplata', color: 'bg-[var(--color-secondary)] text-white px-1.5 py-0.5 rounded-sm' },
    { label: 'OXXO', color: 'bg-[var(--color-primary-light)] text-[var(--color-foreground)] px-1.5 py-0.5 rounded-sm' },
];

/* ── Footer Principal ─────────────────────────────────────────── */
export const Footer: React.FC = () => (
    <footer className="bg-[var(--color-foreground)] text-slate-100 mt-auto" role="contentinfo" aria-label="Pie de página de N-Cargo">
        <div className="max-w-[1280px] mx-auto px-6 py-14">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

                {/* 1. Brand */}
                <div className="space-y-5">
                    <Link href="/" aria-label="N-Cargo — Ir al inicio" className="focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-foreground)]">
                        <Image src="/images/logos/77.PNG" alt="N-Cargo" className="h-[60px] w-auto object-contain rounded-[var(--radius-md)]" width={120} height={60} />
                    </Link>
                    <p className="text-sm leading-relaxed max-w-xs">
                        Tu casillero internacional de confianza. Conectando EE.UU. con Colombia y México de manera rápida, segura y transparente.
                    </p>
                    <div className="flex gap-2.5" role="list" aria-label="Redes sociales de N-Cargo">
                        {SOCIAL_LINKS.map((s) => (
                            <div key={s.label} role="listitem"><SocialIcon {...s} /></div>
                        ))}
                    </div>
                </div>

                {/* 2. Servicios */}
                <FooterLinks title="Servicios" links={DATA_LINKS.services} />

                {/* 3. Empresa */}
                <FooterLinks title="Empresa" links={DATA_LINKS.company} />

                {/* 4. Contacto */}
                <div>
                    <h3 className="text-white font-subtitles font-bold mb-6 text-sm uppercase tracking-wider">Contacto</h3>
                    <address className="not-italic space-y-5 text-sm">
                        {/* Teléfonos */}
                        <div className="flex gap-3 items-start">
                            <svg className={CONTACT_ICON_STYLES} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span>
                                <a href="tel:+13055550190" className={LINK_STYLES}>+1 (305) 555-0190</a><br />
                                <a href="tel:+576015550190" className={LINK_STYLES}>+57 601 555-0190</a>
                            </span>
                        </div>
                        {/* Email */}
                        <div className="flex gap-3 items-start">
                            <svg className={CONTACT_ICON_STYLES} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span>
                                <a href="mailto:info@ncargo.com" className={LINK_STYLES}>info@ncargo.com</a><br />
                                <a href="mailto:soporte@ncargo.com" className={LINK_STYLES}>soporte@ncargo.com</a>
                            </span>
                        </div>
                        {/* Dirección */}
                        <div className="flex gap-3 items-start">
                            <svg className={CONTACT_ICON_STYLES} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>7950 NW 53rd St Suite 337<br />Miami, FL 33166 USA</span>
                        </div>
                    </address>
                </div>
            </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-white/20" style={{ background: 'rgba(0,0,0,.35)' }}>
            <div className="max-w-[1280px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
                <small className="text-xs text-slate-200 font-normal not-italic">© 2026 N-Cargo International Logistics. Todos los derechos reservados.</small>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-200 font-subtitles mr-1">Métodos de pago:</span>
                    {PAYMENT_METHODS.map(({ label, color }) => (
                        <span key={label} className={`${color} font-bold tracking-tight`} aria-label={label}>{label}</span>
                    ))}
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;