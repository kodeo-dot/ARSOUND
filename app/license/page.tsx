import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Download, FileText, ArrowLeft, Check, X, Info, Scale } from "lucide-react"
import Link from "next/link"
import { LICENSE_FULL_TEXT, LICENSE_SUMMARY, LICENSE_CONFIG } from "@/lib/config/license.config"

export const metadata: Metadata = {
  title: "Licencia de Uso - ARSOUND",
  description: "Licencia global de uso de sample packs de ARSOUND. Conoce tus derechos y obligaciones.",
}

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-6xl py-4 px-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
            <Button className="gap-2 rounded-full font-semibold" asChild>
              <a href="/api/license/download" download>
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl py-8 md:py-12 px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Licencia de Uso</h1>
          <p className="text-lg text-muted-foreground mb-2">Términos globales de uso de sample packs en ARSOUND</p>
          <p className="text-sm text-muted-foreground">
            Versión {LICENSE_CONFIG.version} • Actualizado el {LICENSE_CONFIG.lastUpdated}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-500/20 rounded-xl">
                <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">Permitido</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Uso comercial ilimitado</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Modificar y editar samples</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Streaming en plataformas</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <span>Vender producciones finales</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-500/20 rounded-xl">
                <X className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold">No Permitido</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span>Revender samples originales</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span>Reclamar autoría de samples</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span>Redistribuir archivos</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <span>Uso sin compra o licencia</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">Importante</h3>
            </div>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Licencia por compra única</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>No transferible a terceros</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Válida indefinidamente</span>
              </li>
              <li className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Actualizable sin costo</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Resumen Ejecutivo</h2>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 bg-muted/30 p-6 rounded-xl border">
              {LICENSE_SUMMARY}
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-semibold mb-6 pb-4 border-b">Términos Completos de la Licencia</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground/90">{LICENSE_FULL_TEXT}</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <div className="flex gap-4">
            <div className="p-2 bg-yellow-500/20 rounded-lg h-fit">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <p className="font-semibold text-yellow-600 dark:text-yellow-500 mb-2">Aviso Legal Importante</p>
              <p className="text-sm text-yellow-600/90 dark:text-yellow-500/90 leading-relaxed">
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
