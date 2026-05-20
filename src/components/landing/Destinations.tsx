'use client'
import { useState } from 'react';

/* ── Constantes y Datos ─────────────────────────────────────────── */
const DESTINATIONS = {
    co: { flag: '🇨🇴', name: 'Colombia', hub: 'Bogotá', cities: ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales'] },
    mx: { flag: '🇲🇽', name: 'México', hub: 'CDMX', cities: ['CDMX', 'Guadalajara', 'Monterrey', 'Puebla', 'Cancún', 'Mérida', 'Tijuana', 'León'] },
} as const;

const STATS = [
    { value: '200+', label: 'Ciudades' },
    { value: '7–14', label: 'Días hábiles' },
] as const;

const BG_SECTION = 'linear-gradient(135deg, var(--color-foreground) 0%, #0a0f3d 100%)';

type CountryKey = keyof typeof DESTINATIONS;

/* ── Componentes de UI ───────────────────────────────────────────── */
const RoutePoint: React.FC<{ flag: string; city: string; country: string }> = ({ flag, city, country }) => (
    <div className="text-center">
        <div className="text-3xl mb-1">{flag}</div>
        <div className="font-titles font-bold text-base text-white">{city}</div>
        <div className="font-subtitles text-[10px] text-white/50 uppercase">{country}</div>
    </div>
);

/* ── Componente Principal ─────────────────────────────────────────── */
export const Destinations = () => {
    const [active, setActive] = useState<CountryKey>('co');
    const current = DESTINATIONS[active];

    return (
        <section id="destinos" className="py-12 lg:py-16 px-5 lg:px-[5%] relative overflow-hidden" style={{ background: BG_SECTION }}>
            <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

                {/* Columna Izquierda */}
                <div className="text-white space-y-6">
                    {/* Título y descripción */}
                    <div>
                        <p className="section-eyebrow mb-3 text-[var(--color-primary-light)]">Destinos</p>
                        <h1 id="hero-heading" className="font-titles font-black text-white tracking-tighter leading-[1.05] text-3xl md:text-4xl lg:text-6xl">
                            Enviamos a toda Colombia y México
                        </h1>
                        <p className="font-body text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl">
                            Cobertura nacional en ambos países con más de 200 ciudades destino.
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2">
                        {(Object.keys(DESTINATIONS) as CountryKey[]).map((key) => (
                            <button
                                key={key}
                                onClick={() => setActive(key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all duration-200
                                    ${active === key
                                        ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg'
                                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                                    }`}
                            >
                                <span>{DESTINATIONS[key].flag}</span>
                                <span>{DESTINATIONS[key].name}</span>
                            </button>
                        ))}
                    </div>

                    {/* Stats */}
                    <dl className="flex gap-8">
                        {STATS.map(({ value, label }) => (
                            <div key={label}>
                                <dt className="font-subtitles text-[10px] uppercase tracking-wider text-white/50 mb-1">{label}</dt>
                                <dd className="font-titles font-black text-2xl text-white">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Columna Derecha */}
                <div className="glass-card rounded-[var(--radius-xl)] p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <RoutePoint flag="🇺🇸" city="Miami" country="EE.UU." />

                        {/* Trayecto */}
                        <div className="flex-1 px-4 flex flex-col items-center gap-1">
                            <span className="text-xl animate-bounce">✈️</span>
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-ping" />
                            </div>
                            <div className="font-subtitles text-[9px] text-white/40 uppercase">7–14 días</div>
                        </div>

                        <RoutePoint flag={current.flag} city={current.hub} country={current.name} />
                    </div>

                    <ul className="grid grid-cols-3 gap-2">
                        {current.cities.map((city) => (
                            <li key={city} className="bg-white/5 border border-white/10 rounded-lg py-1.5 text-center text-[10px] font-subtitles text-white/70 hover:bg-[var(--color-secondary)]/40 transition-colors">
                                {city}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
};