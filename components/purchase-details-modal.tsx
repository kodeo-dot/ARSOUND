"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, CreditCard, Hash, Tag, DollarSign, CheckCircle } from 'lucide-react'

interface PurchaseDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: {
    id: string
    purchase_code: string | null
    amount: number
    discount_amount?: number | null
    discount_code_used?: string | null
    discount_percent_applied?: number | null
    payment_method: string
    status: string
    created_at: string
    packs: {
      id: string
      title: string
      cover_image_url: string | null
      price: number
    } | null
  } | null
}

export function PurchaseDetailsModal({ open, onOpenChange, purchase }: PurchaseDetailsModalProps) {
  if (!purchase) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  const dateTime = formatDateTime(purchase.created_at)
  const hasDiscount = purchase.discount_code_used && purchase.discount_percent_applied

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-foreground">
            Detalles de Compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pack Info */}
          <div className="flex items-start gap-4">
            <img
              src={purchase.packs?.cover_image_url || "/placeholder.svg?height=80&width=80"}
              alt={purchase.packs?.title || "Pack"}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-foreground line-clamp-2">
                {purchase.packs?.title || "Pack eliminado"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Precio original: ${formatPrice(purchase.packs?.price || 0)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Purchase Details */}
          <div className="space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Fecha y Hora</p>
                <p className="text-sm text-muted-foreground">
                  {dateTime.date} a las {dateTime.time}
                </p>
              </div>
            </div>

            {/* Purchase Code */}
            <div className="flex items-start gap-3">
              <Hash className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Código de Compra</p>
                <p className="text-sm font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-lg inline-block mt-1">
                  {purchase.purchase_code || "No disponible"}
                </p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Método de Pago</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {purchase.payment_method === "mercado_pago" ? "Mercado Pago" : purchase.payment_method}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Estado del Pago</p>
                <Badge
                  variant="secondary"
                  className={`mt-1 ${
                    purchase.status === "completed"
                      ? "bg-green-500/10 text-green-600"
                      : "bg-yellow-500/10 text-yellow-600"
                  }`}
                >
                  {purchase.status === "completed" ? "Completado" : "Pendiente"}
                </Badge>
              </div>
            </div>

            {/* Discount Info */}
            {hasDiscount && (
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Descuento Aplicado</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-green-500/10 text-green-600">
                      {purchase.discount_code_used}
                    </Badge>
                    <span className="text-sm font-bold text-green-600">
                      -{purchase.discount_percent_applied}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-3 bg-muted/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Precio Original</span>
              <span className="font-semibold text-foreground">
                ${formatPrice(purchase.packs?.price || 0)}
              </span>
            </div>

            {hasDiscount && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Descuento ({purchase.discount_percent_applied}%)</span>
                  <span className="font-semibold text-green-600">
                    -${formatPrice(purchase.discount_amount || 0)}
                  </span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Total Pagado</span>
              </div>
              <span className="text-2xl font-black text-primary">
                ${formatPrice(purchase.amount)}
              </span>
            </div>
          </div>

          {/* Support Note */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-xs text-blue-600">
              <span className="font-bold">Nota:</span> Guardá tu código de compra para cualquier consulta o reclamo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
