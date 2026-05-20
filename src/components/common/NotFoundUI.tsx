import Link from 'next/link';

export function NotFoundUI() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-body bg-gray-50">
      <h1 className="text-6xl font-titles text-blue-900 mb-4">404</h1>
      <h2 className="text-2xl font-subtitles text-gray-700 mb-6">Página no encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link 
        href="/" 
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
