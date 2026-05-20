// components/landing/Testimonials.tsx

const testimonials = [
    {
        quote:    '¡Increíble servicio! Compré un MacBook en Amazon y llegó en perfectas condiciones en solo 9 días.',
        name:     'Valentina Suárez',
        city:     'Bogotá',
        flag:     '🇨🇴',
        flagLabel: 'Colombia',
        initials: 'VS',
        stars:    5,
    },
    {
        quote:    'Llevo 2 años usando N-Cargo y nunca me ha fallado. Siempre puntual y muy profesional.',
        name:     'Jorge Ramírez',
        city:     'Ciudad de México',
        flag:     '🇲🇽',
        flagLabel: 'México',
        initials: 'JR',
        stars:    5,
    },
    {
        quote:    'Recibí mis 3 paquetes consolidados en uno y ahorré bastante en el costo del envío.',
        name:     'Luisa Cardona',
        city:     'Medellín',
        flag:     '🇨🇴',
        flagLabel: 'Colombia',
        initials: 'LC',
        stars:    5,
    },
];

export const Testimonials = () => (
    <section
        id="testimonios"
        aria-labelledby="testimonials-heading"
        className="relative py-20 px-5 lg:px-[5%] overflow-hidden"
    >
        {/* ── Imagen de fondo ── */}
        <div
            className="absolute inset-0 bg-cover bg-top -z-20"
            style={{ backgroundImage: "url('/images/website/50.PNG')" }}
            role="presentation"
            aria-hidden="true"
        />
        {/* Overlay claro (60 %) para mantener legibilidad sobre texto oscuro */}
        <div
            className="absolute inset-0 -z-10"
            style={{ background: 'rgba(248,249,251,.92)' }}
            aria-hidden="true"
        />

        <div className="max-w-[1280px] mx-auto">

            {/* Encabezado */}
            <div className="text-center mb-12 animate-fade-in-up">
                <p className="section-eyebrow mb-2">Testimonios</p>
                <h2
                    id="testimonials-heading"
                    className="font-titles font-black text-[var(--color-foreground)]"
                >
                    Lo que dicen nuestros clientes
                </h2>
            </div>

            {/* Cards */}
            <ul
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0 m-0"
                aria-label="Testimonios de clientes"
            >
                {testimonials.map((t, i) => (
                    <li
                        key={t.name}
                        className="
                            bg-white border border-gray-200
                            rounded-[var(--radius-xl)] p-7
                            hover:shadow-[var(--shadow-lg)] hover:-translate-y-1
                            transition-all duration-300 relative
                            animate-fade-in-up
                        "
                        style={{ transitionDelay: `${i * 80}ms` }}
                    >
                        {/* Comillas decorativas */}
                        <div
                            className="absolute top-3 right-5 font-titles select-none text-gray-100"
                            style={{ fontSize: '5rem', lineHeight: 1 }}
                            aria-hidden="true"
                        >
                            "
                        </div>

                        {/* Estrellas */}
                        <div
                            className="flex gap-0.5 mb-4"
                            role="img"
                            aria-label={`${t.stars} de 5 estrellas`}
                        >
                            {Array.from({ length: t.stars }).map((_, si) => (
                                <svg
                                    key={si}
                                    viewBox="0 0 20 20"
                                    className="w-4 h-4"
                                    fill="#FBBF24"
                                    aria-hidden="true"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>

                        {/* Cita */}
                        <blockquote>
                            <p className="font-body text-sm text-gray-700 leading-relaxed mb-6 relative z-10">
                                "{t.quote}"
                            </p>
                        </blockquote>

                        {/* Autor */}
                        <div className="flex items-center gap-3">
                            <div
                                className="
                                    w-10 h-10 rounded-full shrink-0
                                    flex items-center justify-center
                                    font-subtitles font-bold text-sm text-white
                                "
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-secondary) 100%)',
                                }}
                                aria-hidden="true"
                            >
                                {t.initials}
                            </div>
                            <div>
                                <div className="font-subtitles text-sm font-bold text-[var(--color-foreground)] flex items-center gap-1.5">
                                    {t.name}
                                    <span aria-label={t.flagLabel}>{t.flag}</span>
                                </div>
                                <div className="font-body text-xs text-gray-600">
                                    {t.city}
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </section>
);