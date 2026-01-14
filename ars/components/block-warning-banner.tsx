"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BlockWarningBannerProps {
  attemptCount: number
  onDismiss?: () => void
}

export function BlockWarningBanner({ attemptCount, onDismiss }: BlockWarningBannerProps) {
  if (attemptCount === 0) return null

  return (
    <Alert className="border-2 border-orange-500/50 bg-orange-500/10 mb-6 rounded-2xl">
      <AlertTriangle className="h-5 w-5 text-orange-500" />
      <AlertDescription className="ml-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex-1">
            <p className="font-bold text-foreground mb-1 text-base">⚠️ Advertencia: Intento de reupload detectado</p>
            <p className="text-sm text-muted-foreground mb-2">
              Detectamos <span className="font-bold text-orange-500">{attemptCount} intento(s)</span> de subir packs
              duplicados o de otros usuarios.
            </p>
            <p className="text-sm font-semibold text-destructive">
              <ShieldAlert className="h-4 w-4 inline mr-1" />
              El próximo intento resultará en el <span className="underline">bloqueo inmediato</span> de tu cuenta.
            </p>
          </div>
          <div className="flex gap-2">
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs">
                Entendido
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
