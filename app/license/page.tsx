import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Download, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { LICENSE_FULL_TEXT, LICENSE_SUMMARY, LICENSE_CONFIG } from "@/lib/config/license.config"

export const metadata: Metadata = {
  title: "Licencia de Uso - ARSOUND",
  description: "Licencia global de uso de sample packs de ARSOUND. Conoce tus derechos y obligaciones.",
}

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Licencia de Uso</h1>
              <p className="text-muted-foreground">
                Versión {LICENSE_CONFIG.version} - Última actualización: {LICENSE_CONFIG.lastUpdated}
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/api/license/download" download>
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Resumen Rápido</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground bg-transparent border-none p-0">
              {LICENSE_SUMMARY}
            </pre>
          </div>
        </div>

        {/* Full License */}
        <div className="bg-card border rounded-lg p-6 md:p-8">
          <h2 className="text-2xl font-semibold mb-6">Texto Completo</h2>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-foreground leading-relaxed">
              {LICENSE_FULL_TEXT}
            </pre>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Nota Legal:</strong> Este documento debe ser revisado y ajustado por un abogado especializado en
            propiedad intelectual antes de su uso oficial. ARSOUND no se responsabiliza por el uso de este template sin
            revisión legal profesional.
          </p>
        </div>
      </div>
    </div>
  )
}
