import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft, Check, X, Info, Scale } from "lucide-react"
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
        <div className="container max-w-5xl py-4 px-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
            <Button size="sm" className="gap-2 rounded-xl" asChild>
              <a href="/api/license/download" download>
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-12 px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Scale className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 text-foreground">Licencia de Uso</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
            Términos globales de uso de sample packs en ARSOUND
          </p>
          <p className="text-sm text-muted-foreground">
            Versión {LICENSE_CONFIG.version} | Actualizado el {LICENSE_CONFIG.lastUpdated}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="p-2.5 bg-green-500/10 rounded-xl">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-black text-foreground">Permitido</h3>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <span>Uso comercial ilimitado</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <span>Modificar y editar samples</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <span>Streaming en plataformas</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0" />
                <span>Vender producciones finales</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="p-2.5 bg-red-500/10 rounded-xl">
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-black text-foreground">No Permitido</h3>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Revender samples originales</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Reclamar autoría de samples</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Redistribuir archivos</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 dark:bg-red-400 rounded-full mt-2 flex-shrink-0" />
                <span>Uso sin compra o licencia</span>
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="p-2.5 bg-blue-500/10 rounded-xl">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-black text-foreground">Importante</h3>
            </div>
            <ul className="space-y-3 text-sm text-foreground">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span>Licencia por compra única</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span>No transferible a terceros</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span>Válida indefinidamente</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                <span>Actualizable sin costo</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Resumen de la Licencia</h2>
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground bg-muted/30 p-6 rounded-xl border border-border">
              {LICENSE_SUMMARY}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-2xl font-black text-foreground mb-6 pb-4 border-b border-border">Términos Completos</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap leading-relaxed text-foreground">{LICENSE_FULL_TEXT}</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
          <div className="flex gap-4">
            <div className="p-2.5 bg-yellow-500/20 rounded-xl h-fit flex-shrink-0">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            </div>
            <div>
              <p className="font-black text-yellow-600 dark:text-yellow-500 mb-2">Aviso Legal</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500 leading-relaxed">
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
