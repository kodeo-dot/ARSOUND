import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/components/auth-provider"
import { AudioPlayer } from "@/components/audio-player"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ARSOUND - Sample Packs para Productores de LATAM",
  description:
    "Plataforma profesional para comprar y vender sample packs de alta calidad. La comunidad líder de productores musicales en América Latina.",
  generator: "ARSOUND",
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
  keywords: ["sample packs", "producción musical", "audio profesional", "LATAM", "beats", "loops", "sonidos"],
  authors: [{ name: "ARSOUND" }],
  creator: "ARSOUND",
  publisher: "ARSOUND",
  openGraph: {
    type: "website",
    locale: "es_419",
    url: "https://arsound.com",
    title: "ARSOUND - Sample Packs para Productores de LATAM",
    description: "Plataforma profesional para comprar y vender sample packs de alta calidad",
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
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${geistMono.variable} dark`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <AudioPlayer />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
