import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ARSOUND - El marketplace de samples de Argentina",
  description:
    "Comprá y vendé samples, loops y packs de audio profesionales. La plataforma líder para productores musicales en Argentina.",
  generator: "mixflp",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  keywords: ["samples", "loops", "audio", "producción musical", "Argentina", "beats", "sonidos"],
  authors: [{ name: "ARSOUND" }],
  creator: "ARSOUND",
  publisher: "ARSOUND",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://arsound.com.ar",
    title: "ARSOUND - El marketplace de samples de Argentina",
    description: "Comprá y vendé samples, loops y packs de audio profesionales",
    siteName: "ARSOUND",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
