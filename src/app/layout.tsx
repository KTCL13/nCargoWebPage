/* ncargo/src/app/layout.tsx */
import type { Metadata } from "next";
import { leagueSpartan, poppins, montserrat } from "@/lib/fonts";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: "N-Cargo | Conectando Familias",
  description: "Servicios logísticos de confianza y cercanía.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${leagueSpartan.variable} ${poppins.variable} ${montserrat.variable}`}>
      <body className="antialiased font-body">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

