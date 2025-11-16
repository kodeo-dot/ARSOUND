"use client"

import { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { StudioPlusAnalytics } from "@/components/studio-plus-analytics"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock, Loader2 } from 'lucide-react'
import Link from "next/link"

export default function StudioPlusAnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [hasAccess, setHasAccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAccess() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/login")
          return
        }

        setUserId(user.id)

        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single()

        if (profile?.plan === "studio_plus") {
          setHasAccess(true)
        } else {
          setHasAccess(false)
        }
      } catch (error) {
        console.error("[v0] Error checking access:", error)
        setHasAccess(false)
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto p-12 text-center rounded-3xl border-2 border-primary/30">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-4">
              Estadísticas Avanzadas
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Las analíticas avanzadas son exclusivas del plan Studio Plus. 
              Mejorá tu plan para acceder a métricas detalladas sobre tus ventas y reproducciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/plans">
                <Button className="gap-2 rounded-full h-12 px-8">
                  Ver Planes
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="gap-2 rounded-full h-12 px-8 bg-transparent">
                  <ArrowLeft className="h-4 w-4" />
                  Volver a Mi Perfil
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="mb-6">
          <Link href="/profile">
            <Button variant="ghost" className="gap-2 rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Volver a Mi Perfil
            </Button>
          </Link>
        </div>
        {userId && <StudioPlusAnalytics userId={userId} />}
      </main>
      <Footer />
    </div>
  )
}
