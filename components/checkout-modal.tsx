"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard,
  Shield,
  FileText,
  Building2,
  ChevronRight,
  Loader2,
  Lock,
} from "lucide-react"

interface CheckoutModalProps {
  children: React.ReactNode
  packTitle?: string
  packPrice?: number
  packProducer?: string
  packCoverUrl?: string
}

export function CheckoutModal({
  children,
  packTitle = "Neon Cumbia Vol. 3",
  packPrice = 4500,
  packProducer = "mixflp",
  packCoverUrl,
}: CheckoutModalProps) {
  const [open, setOpen] = useState(false)
  const [needsInvoice, setNeedsInvoice] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [invoiceData, setInvoiceData] = useState({
    cuit: "",
    businessName: "",
  })

  const formattedPrice = packPrice.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })

  const handleCheckout = async () => {
    setIsProcessing(true)
    // Simulating a brief delay for the demo preview
    setTimeout(() => {
      setIsProcessing(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-card border-border rounded-2xl">
        {/* Header with product info */}
        <div className="p-6 pb-4">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-xl font-black text-foreground">
              Confirmar compra
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {packCoverUrl ? (
                <img
                  src={packCoverUrl}
                  alt={packTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-foreground text-sm truncate">
                {packTitle}
              </h4>
              <p className="text-xs text-muted-foreground">por {packProducer}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-black text-foreground">
                ${formattedPrice}
              </div>
              <div className="text-[11px] text-muted-foreground">ARS</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment methods */}
        <div className="p-6 space-y-4">
          <h4 className="text-sm font-bold text-foreground">
            Metodo de pago
          </h4>

          {/* Mercado Pago - Primary */}
          <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#00b1ea] flex items-center justify-center flex-shrink-0">
                  <svg
                    viewBox="0 0 40 40"
                    fill="none"
                    className="h-6 w-6"
                  >
                    <path
                      d="M20 8c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm-1.5 17.5h-2v-7h2v7zm4 0h-2v-11h2v11z"
                      fill="#fff"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    Mercado Pago
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tarjetas, debito o efectivo
                  </div>
                </div>
              </div>
              <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                <div className="h-2 w-2 bg-primary-foreground rounded-full" />
              </div>
            </div>
          </div>

          {/* Payment icons row */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Visa */}
              <div className="h-7 px-2 rounded bg-secondary border border-border flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground tracking-wide">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="h-7 px-2 rounded bg-secondary border border-border flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground tracking-wide">MC</span>
              </div>
              {/* AMEX */}
              <div className="h-7 px-2 rounded bg-secondary border border-border flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground tracking-wide">AMEX</span>
              </div>
              {/* Rapipago */}
              <div className="h-7 px-2.5 rounded bg-secondary border border-border flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary tracking-wide">Rapipago</span>
              </div>
              {/* Pago Facil */}
              <div className="h-7 px-2.5 rounded bg-secondary border border-border flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary tracking-wide">{"PagoFacil"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Toggle */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <Label htmlFor="invoice-toggle" className="text-sm font-bold text-foreground cursor-pointer">
                    Necesito Factura
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Factura C emitida automaticamente
                  </p>
                </div>
              </div>
              <Switch
                id="invoice-toggle"
                checked={needsInvoice}
                onCheckedChange={setNeedsInvoice}
              />
            </div>

            {/* Invoice form (expanded) */}
            {needsInvoice && (
              <div className="space-y-3 p-4 rounded-xl border border-border bg-secondary/30 animate-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-accent" />
                  <span className="text-xs font-bold text-foreground">
                    Datos de facturacion
                  </span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuit" className="text-xs font-semibold text-muted-foreground">
                    CUIT / CUIL
                  </Label>
                  <Input
                    id="cuit"
                    placeholder="20-12345678-9"
                    value={invoiceData.cuit}
                    onChange={(e) =>
                      setInvoiceData((prev) => ({
                        ...prev,
                        cuit: e.target.value,
                      }))
                    }
                    className="rounded-lg bg-card border-border h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-name" className="text-xs font-semibold text-muted-foreground">
                    Razon Social / Nombre
                  </Label>
                  <Input
                    id="business-name"
                    placeholder="Nombre o razon social"
                    value={invoiceData.businessName}
                    onChange={(e) =>
                      setInvoiceData((prev) => ({
                        ...prev,
                        businessName: e.target.value,
                      }))
                    }
                    className="rounded-lg bg-card border-border h-10 text-sm"
                  />
                </div>

                <p className="text-[10px] text-muted-foreground flex items-start gap-1.5 pt-1">
                  <Shield className="h-3 w-3 flex-shrink-0 mt-0.5 text-primary" />
                  Se enviara una Factura C automaticamente al email asociado a tu cuenta dentro de las 72hs.
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Summary + CTA */}
        <div className="p-6 space-y-4 bg-secondary/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total a pagar</span>
            <span className="text-2xl font-black text-foreground">
              ${formattedPrice} <span className="text-xs text-muted-foreground font-medium">ARS</span>
            </span>
          </div>

          <Button
            className="w-full rounded-full h-12 font-bold text-sm gap-2 shadow-lg shadow-primary/25"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirigiendo a Mercado Pago...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pagar con Mercado Pago
                <ChevronRight className="h-4 w-4 ml-auto" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
            Seras redirigido a Mercado Pago para completar tu pago de forma segura.
            Al continuar, aceptas los{" "}
            <a href="/legal/terminos-condiciones" className="underline text-primary hover:text-primary/80">
              terminos y condiciones
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
