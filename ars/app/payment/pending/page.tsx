'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'

export default function PaymentPendingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2 text-yellow-600">Pago pendiente</h1>
          <p className="text-muted-foreground mb-6">
            Tu pago está siendo procesado. Recibirás una confirmación en breve. Por favor no cierres esta página.
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.back()} className="flex-1">
              Volver
            </Button>
            <Button onClick={() => router.push('/profile')} className="flex-1">
              Mi perfil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
