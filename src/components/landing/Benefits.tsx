// components/landing/Benefits.tsx
import { Icons } from '@/components/ui/Icons';

/* ── Tipos ────────────────────────────────────────────────────────── */
interface Benefit {
    title: string;
    desc: string;
    icon: React.ReactNode;
    bg: string;
    color: string;
}

/* ── Datos ────────────────────────────────────────────────────────── */
const benefits: Benefit[] = [
    { title: 'Tarifas transparentes', desc: 'Sin cargos ocultos. Conoces el precio total antes de confirmar.', icon: <Icons.Shield className="w-6 h-6" />, bg: 'bg-[#e8ebff]', color: 'var(--color-secondary)' },
    { title: 'Seguimiento 24/7', desc: 'Rastrea tu paquete en tiempo real en cada etapa del recorrido.', icon: <Icons.Clock className="w-6 h-6" />, bg: 'bg-[#e8ebff]', color: 'var(--color-secondary)' },
    { title: 'Casillero internacional', desc: 'Tu propia dirección en Miami, gratis. Ahorra consolidando envíos.', icon: <Icons.Home className="w-6 h-6" />, bg: 'bg-[#eef2ff]', color: 'var(--color-secondary)' },
    { title: 'Atención personalizada', desc: 'Asesores bilingües disponibles para ayudarte en todo momento.', icon: <Icons.Users className="w-6 h-6" />, bg: 'bg-[#f0fdf4]', color: '#16a34a' },
    { title: 'Seguro de carga', desc: 'Protección total contra pérdidas y daños durante el envío.', icon: <Icons.ShieldCheck className="w-6 h-6" />, bg: 'bg-[#f0fdf4]', color: '#16a34a' },
    { title: 'Múltiples formas de pago', desc: 'Paga con tarjeta, transferencia, Nequi o Daviplata fácilmente.', icon: <Icons.CreditCard className="w-6 h-6" />, bg: 'bg-[#f3e8ff]', color: '#9333ea' },
    { title: 'Envíos express', desc: 'Opciones de entrega rápida para cuando necesitas tu paquete urgente.', icon: <Icons.Rocket className="w-6 h-6" />, bg: 'bg-[#fff7ed]', color: '#ea580c' },
    { title: 'Vuelos directos', desc: 'Sin escalas ni retrasos. Tus paquetes llegan siempre a tiempo.', icon: <Icons.Plane className="w-6 h-6" />, bg: 'bg-[#e8ebff]', color: 'var(--color-secondary)' },
];

/* ── Componentes ─────────────────────────────────────────────────── */
const BenefitCard = ({ title, desc, icon, bg, color, index }: Benefit & { index: number }) => (
    <li
        className="group relative bg-white border border-gray-200 rounded-[var(--radius-xl)] p-5 hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300 overflow-hidden focus-within:shadow-[var(--shadow-md)] animate-fade-in-up"
        style={{ transitionDelay: `${index * 60}ms` }}
    >
        {/* Barra de acento superior */}
        <div
            className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
            style={{ background: `linear-gradient(90deg, ${color}, var(--color-secondary))` }}
            aria-hidden="true"
        />

        {/* Ícono */}
        <div className={`w-11 h-11 rounded-[var(--radius-lg)] ${bg} flex items-center justify-center mb-4`} style={{ color }} aria-hidden="true">
            {icon}
        </div>

        <h3 className="font-titles font-bold text-base text-[var(--color-foreground)] mb-1">{title}</h3>
        <p className="font-body text-xs text-gray-500 leading-relaxed">{desc}</p>
    </li>
);

/* ── Sección Principal ─────────────────────────────────────────────── */
export const Benefits = () => (
    <section id="servicios" aria-labelledby="benefits-heading" className="relative py-20 px-5 lg:px-[5%] overflow-hidden">
        {/* Fondo y Overlay */}
        <div className="absolute inset-0 bg-cover bg-center -z-20" style={{ backgroundImage: "url('/images/website/47.PNG')" }} role="presentation" aria-hidden="true" />
        <div className="absolute inset-0 -z-10" style={{ background: 'rgba(255,255,255,.93)' }} aria-hidden="true" />

        <div className="max-w-[1280px] mx-auto">
            {/* Título y descripción */}
            <div className="flex flex-col items-center text-center mb-16">
                <p className="section-eyebrow mb-3 text-[var(--color-primary-light)]">Nuestras ventajas</p>
                <h2 id="hero-heading" className="font-titles font-black tracking-tighter leading-[1.05] text-3xl md:text-4xl lg:text-6xl">
                    ¿Por qué elegir N-Cargo?
                </h2>
                <p className="font-body text-lg md:text-xl text[var(--color-foreground)] leading-relaxed max-w-2xl">
                    Más de 50.000 clientes confían en nosotros para sus envíos internacionales.
                </p>
            </div>
            {/* Grid de Cards */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0" aria-label="Lista de beneficios de N-Cargo">
                {benefits.map((b, i) => <BenefitCard key={b.title} {...b} index={i} />)}
            </ul>
        </div>
    </section>
);