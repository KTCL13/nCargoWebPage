import Link from 'next/link';
import Image from 'next/image';

/* ── Constantes ────────────────────────────────────────────────────── */
const BG_OVERLAY = 'linear-gradient(135deg, rgba(4,6,38,.92) 0%, rgba(12,30,140,.85) 60%, rgba(4,6,38,.90) 100%)';
const TRUST_FEATURES = ['Sin membresía', 'Sin compromisos', 'Listo en 2 min'] as const;

/* ── Componente ─────────────────────────────────────────────────────── */
export const CTASection = () => (
    <section
        id="contacto"
        aria-labelledby="cta-heading"
        className="relative py-20 px-5 lg:px-[5%] text-center overflow-hidden"
    >
        {/* Fondo y Overlay */}
        <div className="absolute inset-0 -z-20" role="presentation">
            <Image
                src="/images/website/54.PNG"
                alt="Fondo CTA"
                fill
                priority
                sizes="100vw"
                quality={75}
                className="object-cover object-center -z-20"
            />
        </div>
        <div className="absolute inset-0 -z-10" style={{ background: BG_OVERLAY }} aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto animate-fade-in-up">
            {/* Ícono (Acento Rojo) */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)] mb-5 bg-white/10 border border-white/20">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-[var(--color-primary)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            </div>

            <p className="section-eyebrow mb-3 text-[var(--color-primary-light)]">Únete hoy</p>
            <h2 id="cta-heading" className="font-titles font-black text-white text-3xl md:text-5xl mb-4 leading-tight uppercase">
                ¿Listo para empezar a ahorrar?
            </h2>
            <p className="font-body text-base text-white/75 mb-8 max-w-md mx-auto leading-relaxed">
                Crea tu casillero gratuito en Miami en menos de 2 minutos. Tu primera dirección americana te espera.
            </p>

            {/* Botón CTA */}
            <div className="flex justify-center">
                <Link
                    href="/login"
                    className="
                        inline-flex items-center justify-center gap-3
                        font-titles font-extrabold text-[var(--color-bg-dark)] text-sm
                        bg-white px-8 py-3.5 rounded-full shadow-xl
                        hover:scale-105 hover:bg-gray-100
                        transition-all duration-200
                        focus-visible:outline-none focus-visible:ring-[3px]
                        focus-visible:ring-white focus-visible:ring-offset-2
                        focus-visible:ring-offset-[var(--color-secondary)]
                    "
                    aria-label="Crear casillero gratis en N-Cargo"
                >
                    Crea tu casillero gratis
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                </Link>
            </div>

            {/* Trust Bullets */}
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-6 list-none" aria-label="Garantías">
                {TRUST_FEATURES.map((item) => (
                    <li key={item} className="font-subtitles text-[10px] text-white/55 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="font-bold text-white/70">✓</span>{item}
                    </li>
                ))}
            </ul>
        </div>
    </section>
);