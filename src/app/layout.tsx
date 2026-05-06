/* ncargo/src/app/layout.tsx */
import type { Metadata } from "next";
import { League_Spartan, Poppins, Montserrat } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { AuthProvider } from '@/context/AuthContext'

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  variable: "--font-titles",
  weight: ["700"],
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-subtitles",
  weight: ["500", "600"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500"],
  display: "swap",
});

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
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
