// components/landing/HowItWorks.tsx

/* ── Constantes de Estilo ─────────────────────────────────────────── */
const BG_OVERLAY = 'linear-gradient(160deg, rgba(4,6,38,.95) 0%, rgba(12,30,140,.80) 60%, rgba(4,6,38,.95) 100%)';
const LINE_GRADIENT = 'linear-gradient(90deg, transparent 0%, rgba(12,30,140,.5) 30%, rgba(26,59,175,.5) 70%, transparent 100%)';
const BADGE_STYLES = "absolute -top-2 -right-2 w-8 h-8 rounded-full font-titles text-sm font-black flex items-center justify-center bg-[var(--color-primary)] text-white shadow-lg ring-4 ring-[var(--color-foreground)]";

/* ── Datos ─────────────────────────────────────────────────────────── */
const steps = [
    { title: 'Recogemos', desc: 'Compra en tu tienda favorita de EE.UU. y envía a tu casillero en Miami.', color: 'var(--color-secondary)', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></> },
    { title: 'Transportamos', desc: 'Tu paquete viaja en vuelos directos certificados desde Miami.', color: 'var(--color-secondary)', icon: <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /> },
    { title: 'Aduana', desc: 'Nos encargamos de todos los trámites y documentación aduanera.', color: 'var(--color-secondary)', icon: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h8M8 17h8M8 9h1" /></> },
    { title: 'Entregamos', desc: 'Recibe tu pedido directamente en la puerta de tu casa.', color: 'var(--color-secondary)', icon: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
];

/* ── Componente ─────────────────────────────────────────────────────── */
export const HowItWorks = () => (
    <section id="como-funciona" aria-labelledby="hiw-heading" className="relative pt-16 pb-24 px-5 lg:px-[5%] overflow-hidden">
        {/* Fondo y Overlay */}
        <div className="absolute inset-0 bg-cover bg-center -z-20" style={{ backgroundImage: "url('/images/website/48.PNG')" }} role="presentation" aria-hidden="true" />
        <div className="absolute inset-0 -z-10" style={{ background: BG_OVERLAY }} aria-hidden="true" />

        <div className="max-w-[1280px] mx-auto relative z-10">
            {/* Título y descripción */}
            <div className="flex flex-col items-center text-center mb-16">
                <p className="section-eyebrow mb-3 text-[var(--color-primary-light)]">¿Cómo funciona?</p>
                <h2 id="hero-heading" className="font-titles font-black text-white tracking-tighter leading-[1.05] text-3xl md:text-4xl lg:text-6xl">
                    Tan fácil como 1, 2, 3, 4
                </h2>
                <p className="font-body text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl">
                    Desde que compras hasta que recibes tu pedido en casa
                </p>
            </div>
            {/* Pasos */}
            <div className="relative">
                {/* Línea conectora */}
                <div className="hidden lg:block absolute top-[50px] left-[10%] right-[10%] h-px -z-10" style={{ background: LINE_GRADIENT }} aria-hidden="true" />

                <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 list-none p-0 m-0" aria-label="Pasos del proceso de envío">
                    {steps.map((step, i) => (
                        <li key={step.title} className="group text-center flex flex-col items-center cursor-default">
                            {/* Contenedor del Ícono */}
                            <div className="w-[100px] h-[100px] rounded-2xl mb-6 flex items-center justify-center relative bg-white/5 border border-white/10 transition-all duration-500 group-hover:scale-105 group-hover:bg-white/10 group-hover:shadow-[0_16px_36px_rgba(12,30,140,.3)]">
                                <span className={BADGE_STYLES} aria-hidden="true">{i + 1}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 transition-transform duration-500 group-hover:rotate-6" style={{ color: step.color }} aria-hidden="true">
                                    {step.icon}
                                </svg>
                            </div>

                            <h3 className="font-titles font-bold text-lg mb-2 tracking-wide text-white uppercase">
                                <span className="sr-only">Paso {i + 1}: </span>{step.title}
                            </h3>
                            <p className="font-body text-xs leading-relaxed max-w-[220px] text-gray-400">{step.desc}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    </section>
);