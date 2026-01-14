"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

export default function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createBrowserClient()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("Procesando tu pago...")
  const [packId, setPackId] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const collectionId = searchParams.get("collection_id")
        const externalReference = searchParams.get("external_reference")
        const collectionStatus = searchParams.get("collection_status")
        const paymentId = searchParams.get("payment_id")

        console.log("[v0] Payment success page loaded with params:", {
          collectionId,
          externalReference,
          collectionStatus,
          paymentId,
        })

        if (collectionStatus !== "approved") {
          setStatus("error")
          setMessage("El pago fue rechazado o aún está pendiente")
          return
        }

        if (externalReference?.includes("plan_")) {
          console.log("[v0] Plan payment detected, activating plan...")

          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (!session?.user?.id) {
            console.error("[v0] No authenticated user found for plan activation")
            setStatus("error")
            setMessage("Error de autenticación. Por favor, inicia sesión nuevamente.")
            setTimeout(() => router.push("/login"), 3000)
            return
          }

          // Call the manual activation endpoint with payment details
          try {
            console.log("[v0] Calling manual plan activation API...")
            const activateResponse = await fetch("/api/manual-activate-plan", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                externalReference,
                paymentId,
                userId: session.user.id,
              }),
            })

            const activateData = await activateResponse.json()
            console.log("[v0] Plan activation response:", activateData)

            if (activateResponse.ok && activateData.success) {
              console.log("[v0] Plan activated successfully:", activateData.planType)
              setStatus("success")
              setMessage(`¡Plan ${activateData.planType} activado exitosamente! Redirigiendo...`)
            } else {
              console.error("[v0] Failed to activate plan:", activateData)
              setStatus("error")
              setMessage("Error al activar el plan. Contacta a soporte con el ID de pago: " + paymentId)
              return
            }
          } catch (err) {
            console.error("[v0] Error calling plan activation API:", err)
            setStatus("error")
            setMessage("Error al activar el plan. Contacta a soporte con el ID de pago: " + paymentId)
            return
          }

          setTimeout(() => router.push("/profile"), 3000)
        } else if (externalReference?.includes("pack_")) {
          const packIdFromRef = externalReference.split("_")[2]
          setPackId(packIdFromRef)

          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession()

          if (sessionError) {
            console.warn("[v0] Session error:", sessionError)
          }

          if (!session?.user?.id) {
            console.error("[v0] No authenticated user found")
            setStatus("error")
            setMessage("Error de autenticación. Por favor, inicia sesión nuevamente.")
            setTimeout(() => router.push("/login"), 3000)
            return
          }

          const authToken = session.access_token
          console.log("[v0] User authenticated:", session.user.id)

          try {
            console.log("[v0] Recording purchase via API:", { packIdFromRef, paymentId })

            const recordResponse = await fetch("/api/payments/record", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                packId: packIdFromRef,
                paymentId: paymentId,
                buyerId: session.user.id,
              }),
            })

            const recordData = await recordResponse.json()

            if (recordResponse.ok) {
              console.log("[v0] Purchase recorded successfully:", recordData)
            } else {
              console.error("[v0] Failed to record purchase:", recordResponse.status, recordData)
              if (recordResponse.status === 401) {
                setStatus("error")
                setMessage("Sesión expirada. Por favor, inicia sesión nuevamente.")
                setTimeout(() => router.push("/login"), 3000)
                return
              }
            }
          } catch (err) {
            console.error("[v0] Error recording purchase:", err)
          }

          setStatus("success")
          setMessage("¡Pack comprado exitosamente! Preparando descarga...")

          setTimeout(async () => {
            try {
              console.log("[v0] Starting download for pack:", packIdFromRef)
              const response = await fetch(`/api/packs/${packIdFromRef}/download`)

              if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url

                const { data: pack } = await supabase.from("packs").select("title").eq("id", packIdFromRef).single()

                a.download = `${(pack?.title || "pack").replace(/[^a-zA-Z0-9]/g, "_")}.zip`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                console.log("[v0] Download completed successfully")
              } else {
                const error = await response.json()
                console.error("[v0] Download failed:", response.status, error)
              }
            } catch (err) {
              console.error("[v0] Download error:", err)
            }

            console.log("[v0] Redirecting to profile")
            router.push("/profile")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("No se pudo identificar el tipo de compra")
        }
      } catch (error) {
        console.error("[v0] Error processing payment:", error)
        setStatus("error")
        setMessage("Hubo un error procesando tu pago. Por favor contacta a soporte.")
      }
    }

    processPayment()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center">
          {status === "processing" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Procesando</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h1 className="text-2xl font-bold mb-2 text-green-600">¡Éxito!</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => router.push("/profile")} className="flex-1 rounded-full">
                  Mi perfil
                </Button>
                <Button onClick={() => router.push("/")} className="flex-1 rounded-full">
                  Explorar más
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 text-red-500 flex items-center justify-center">
                <span className="text-4xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => router.back()} className="flex-1 rounded-full">
                  Volver
                </Button>
                <Button onClick={() => router.push("/profile")} className="flex-1 rounded-full">
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
