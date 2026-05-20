import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const Calculator = dynamic(() => import('@/components/landing/ShippingCalculator').then(mod => mod.Calculator), { ssr: false });
import { Icons } from '@/components/ui/Icons';

export const Hero = () => (
    <section
        id="inicio"
        aria-labelledby="hero-heading"
        className="relative min-h-screen lg:min-h-[90vh] flex flex-col justify-center px-5 lg:px-[5%] overflow-hidden mt-[80px]"
    >
        {/* Fondo */}
        <div className="absolute inset-0 -z-20">
            <Image
                src="/images/website/45.PNG"
                alt="Fondo N-Cargo"
                fill
                priority
                fetchPriority="high"
                quality={70}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center"
            />
        </div>

        {/* Overlay oscuro */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#040626]/90 via-[#040626]/80 to-[#040626]/95" />

        <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="space-y-6">
                {/* Título y descripción */}
                <div>
                    <p className="section-eyebrow mb-3 text-[var(--color-primary-light)]">Casillero Internacional</p>
                    <h1 id="hero-heading" className="font-titles font-black text-white tracking-tighter leading-[1.05] text-3xl md:text-4xl lg:text-6xl">
                        Envíos rápidos a Colombia y México
                    </h1>
                    <p className="font-body text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mt-4">
                        Compra en tus tiendas favoritas de EE.UU. y recibe en casa de forma segura.
                    </p>
                </div>

                {/* BOTONES */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-2">
                    <Link href="#contacto" className="btn-primary text-sm">
                        <Icons.User />
                        Crear casillero gratis
                    </Link>

                    <Link href="#como-funciona" className="btn-ghost text-sm">
                        <Icons.ArrowRight />
                        ¿Cómo funciona?
                    </Link>
                </div>
            </div>

            {/* CALCULADORA */}
            <div
                className="flex justify-center items-center w-full animate-fade-in-up"
                style={{ animationDelay: '120ms' }}
            >
                <div className="w-full max-w-[420px]">
                    <Calculator />
                </div>
            </div>
        </div>
    </section>
);
