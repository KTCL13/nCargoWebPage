import Image from 'next/image'

interface AuthFormCardProps {
  title: string
  subtitle?: string
  imageSrc?: string
  children: React.ReactNode
}

export function AuthFormCard({
  title,
  subtitle,
  imageSrc = '/images/website/55.PNG',
  children,
}: AuthFormCardProps) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-center items-center overflow-hidden">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 55vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-nc-dark)]/85 via-[var(--color-nc-blue)]/55 to-[var(--color-nc-red)]/35" />
        <div className="relative z-10 text-center max-w-lg space-y-8 px-12">
          <h1 className="font-titles text-4xl text-white">
            Conectando Familias
            <br />a Través de Fronteras
          </h1>
          <p className="text-white/80 text-lg font-body">
            Gestiona envíos con <strong>N-Cargo</strong>.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <main className="flex-1 flex items-center justify-center bg-[#F9FAFB] px-6 py-10">
        <div className="w-full max-w-[400px]">
          <h2 className="mb-2 text-center font-titles text-2xl text-[var(--color-nc-dark)]">
            {title}
          </h2>
          {subtitle && (
            <p className="font-subtitles text-sm text-gray-500 text-center mb-8">{subtitle}</p>
          )}
          {!subtitle && <div className="mb-8" />}
          {children}
        </div>
      </main>
    </div>
  )
}
