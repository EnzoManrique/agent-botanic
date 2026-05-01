import type { Metadata, Viewport } from "next"
import { Doto, Fraunces } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import "./globals.css"

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Secretary Botanic — Tu agente de cuidado de plantas",
  description:
    "Asistente de cuidado de plantas con IA. Identifica especies, recordá riegos y recibí alertas climáticas para Mendoza.",
  generator: "v0.app",
  applicationName: "Secretary Botanic",
  manifest: "/manifest.webmanifest",
  // Iconos para todos los contextos: browser tab, PWA Android, iOS home screen.
  // Next.js inyecta automáticamente las <link> tags correctas.
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.jpg", sizes: "1024x1024" },
    ],
    shortcut: ["/icon.svg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Secretary Botanic",
    startupImage: ["/apple-touch-icon.jpg"],
  },
}

export const viewport: Viewport = {
  // Cream del header para que el status bar del notch en iOS se funda
  // con la barra superior de la app (no se ve un "corte" verde encima).
  // iOS Safari calcula automáticamente el color del texto del status bar
  // según el contraste, así que con cream queda con texto oscuro legible.
  themeColor: "#f5efe0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${doto.variable} ${fraunces.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AuthSessionProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthSessionProvider>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
