import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Download, FileText, ArrowLeft, Check, X, Info } from "lucide-react"
import Link from "next/link"
import { LICENSE_FULL_TEXT, LICENSE_SUMMARY, LICENSE_CONFIG } from "@/lib/config/license.config"

export const metadata: Metadata = {
  title: "Licencia de Uso - ARSOUND",
  description: "Licencia global de uso de sample packs de ARSOUND. Conoce tus derechos y obligaciones.",
}

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/10">
      <div className="container max-w-5xl py-6 md:py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">Licencia de Uso</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Versión {LICENSE_CONFIG.version} • Actualizado el {LICENSE_CONFIG.lastUpdated}
              </p>
            </div>
            <Button className="gap-2 rounded-full font-semibold" asChild>
              <a href="/api/license/download" download>
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Permitido</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Uso comercial ilimitado</li>
                  <li>✓ Modificar y editar samples</li>
                  <li>✓ Streaming en plataformas</li>
                  <li>✓ Vender producciones finales</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <X className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">No Permitido</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✗ Revender samples originales</li>
                  <li>✗ Reclamar autoría de samples</li>
                  <li>✗ Redistribuir archivos</li>
                  <li>✗ Uso sin compra o licencia</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-card border rounded-xl p-6 md:p-8 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Resumen Ejecutivo</h2>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/50 p-4 rounded-lg">
              {LICENSE_SUMMARY}
            </pre>
          </div>
        </div>

        {/* Full License */}
        <div className="bg-card border rounded-xl p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6">Términos Completos de la Licencia</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {LICENSE_FULL_TEXT}
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500 mb-1">Aviso Legal Importante</p>
              <p className="text-sm text-yellow-600/90 dark:text-yellow-500/90">
                Este documento debe ser revisado y validado por un abogado especializado en propiedad intelectual antes
                de su uso oficial. ARSOUND no se responsabiliza por el uso de este template sin revisión legal
                profesional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
