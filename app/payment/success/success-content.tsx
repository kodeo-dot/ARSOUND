"use client";

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Procesando tu pago...')

  useEffect(() => {
    const processPayment = async () => {
      try {
        const collectionId = searchParams.get('collection_id')
        const externalReference = searchParams.get('external_reference')
        const collectionStatus = searchParams.get('collection_status')
        const paymentId = searchParams.get('payment_id')

        console.log('[v0] Payment success page loaded with params:', {
          collectionId,
          externalReference,
          collectionStatus,
          paymentId,
        })

        if (collectionStatus !== 'approved') {
          setStatus('error')
          setMessage('El pago fue rechazado o aún está pendiente')
          return
        }

        await new Promise(resolve => setTimeout(resolve, 2000))

        if (externalReference?.includes('plan_')) {
          setStatus('success')
          setMessage('¡Plan actualizado exitosamente! Redirigiendo...')
          setTimeout(() => router.push('/profile'), 3000)
        } else if (externalReference?.includes('pack_')) {
          setStatus('success')
          setMessage('¡Pack comprado exitosamente! Redirigiendo...')
          setTimeout(() => router.push('/profile'), 3000)
        } else {
          setStatus('error')
          setMessage('No se pudo identificar el tipo de compra')
        }
      } catch (error) {
        console.error('[v0] Error processing payment:', error)
        setStatus('error')
        setMessage('Hubo un error procesando tu pago. Por favor contacta a soporte.')
      }
    }

    processPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Procesando</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-2xl font-bold mb-2 text-green-600">¡Éxito!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => router.push('/profile')} className="w-full">
                Ir a mi perfil
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 text-red-500 flex items-center justify-center">
                <span className="text-4xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => router.back()} className="flex-1">
                  Volver
                </Button>
                <Button onClick={() => router.push('/profile')} className="flex-1">
                  Mi perfil
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
