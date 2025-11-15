"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, Zap, Crown, AlertCircle } from 'lucide-react'
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { PlanType } from "@/lib/plans"

interface ProfileLimitsCardProps {
  userId: string
  userPlan: PlanType
}

export function ProfileLimitsCard({ userId, userPlan }: ProfileLimitsCardProps) {
  const [uploadLimit, setUploadLimit] = useState<any>(null)
  const [downloadLimit, setDownloadLimit] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const { data: uploadData, error: uploadError } = await supabase.rpc(
          "get_remaining_uploads",
          { p_user_id: userId }
        )

        const { data: downloadData, error: downloadError } = await supabase.rpc(
          "get_download_limit",
          { p_user_id: userId }
        )

        console.log("[v0] Upload limits:", uploadData, uploadError)
        console.log("[v0] Download limits:", downloadData, downloadError)

        if (!uploadError && uploadData) {
          setUploadLimit(uploadData)
        }
        if (!downloadError && downloadData) {
          setDownloadLimit(downloadData)
        }
      } catch (error) {
        console.error("[v0] Could not fetch limits:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLimits()
    const interval = setInterval(fetchLimits, 10000)
    return () => clearInterval(interval)
  }, [userId, supabase])

  if (isLoading) {
    return (
      <Card className="p-6 border-2 border-border bg-card rounded-2xl animate-pulse">
        <div className="h-6 bg-muted rounded w-24 mb-6" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl" />
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-2 border-border bg-card rounded-2xl">
      <h3 className="font-bold text-foreground mb-6 text-lg">Tus límites</h3>

      <div className="space-y-4">
        {/* Downloads section */}
        <div className="p-4 rounded-xl bg-accent/50 border border-border hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Descargas este mes</span>
            </div>
            {downloadLimit?.limit === "unlimited" ? (
              <span className="text-2xl font-black text-primary">∞</span>
            ) : (
              <span className="text-2xl font-black text-primary">
                {downloadLimit?.used || 0} / {downloadLimit?.limit || 10}
              </span>
            )}
          </div>
          {downloadLimit?.limit !== "unlimited" && (
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  downloadLimit?.remaining === 0 ? "bg-destructive" : "bg-primary"
                }`}
                style={{
                  width: `${
                    downloadLimit?.limit
                      ? ((downloadLimit?.used || 0) / downloadLimit.limit) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {downloadLimit?.limit === "unlimited"
              ? "Descargas ilimitadas"
              : `${downloadLimit?.remaining || 10} descargas restantes este mes`}
          </p>
        </div>

        {/* Uploads section */}
        <div className="p-4 rounded-xl bg-accent/50 border border-border hover:border-secondary/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-secondary" />
              <span className="font-semibold text-foreground">
                {userPlan === 'free' ? 'Packs totales' : 'Packs este mes'}
              </span>
            </div>
            {uploadLimit?.limit === "unlimited" ? (
              <span className="text-2xl font-black text-secondary">∞</span>
            ) : (
              <span className="text-2xl font-black text-secondary">
                {userPlan === 'free' 
                  ? `${uploadLimit?.total_packs || 0} / ${uploadLimit?.limit || 3}`
                  : `${uploadLimit?.uploaded_this_month || 0} / ${uploadLimit?.limit || 10}`
                }
              </span>
            )}
          </div>
          {uploadLimit?.limit !== "unlimited" && (
            <div className="w-full bg-secondary rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  uploadLimit?.remaining === 0 ? "bg-destructive" : "bg-secondary"
                }`}
                style={{
                  width: `${
                    uploadLimit?.limit
                      ? userPlan === 'free'
                        ? ((uploadLimit?.total_packs || 0) / uploadLimit.limit) * 100
                        : ((uploadLimit?.uploaded_this_month || 0) / uploadLimit.limit) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {uploadLimit?.limit === "unlimited"
              ? "Packs ilimitados"
              : userPlan === 'free'
                ? `${uploadLimit?.remaining || 3} packs restantes (total)`
                : `${uploadLimit?.remaining || 10} packs restantes este mes`}
          </p>
        </div>

        {/* Warning when limits reached */}
        {(uploadLimit?.remaining === 0 || downloadLimit?.remaining === 0) && (
          <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-600">
              {uploadLimit?.remaining === 0 && downloadLimit?.remaining === 0
                ? "Alcanzaste los límites de tu plan"
                : uploadLimit?.remaining === 0
                  ? "Alcanzaste el límite de packs"
                  : "Alcanzaste el límite de descargas"}
            </p>
          </div>
        )}

        {/* Upgrade CTA for Free users */}
        {userPlan === "free" && (uploadLimit?.remaining === 0 || downloadLimit?.remaining === 0) && (
          <Link href="/plans" className="block">
            <Button className="w-full h-11 gap-2 rounded-lg bg-primary hover:bg-primary/90">
              <Zap className="h-4 w-4" />
              Mejorar Plan
            </Button>
          </Link>
        )}

        {/* Upgrade CTA for De 0 a Hit users */}
        {userPlan === "de_0_a_hit" && (uploadLimit?.remaining === 0 || downloadLimit?.remaining === 0) && (
          <Link href="/plans" className="block">
            <Button className="w-full h-11 gap-2 rounded-lg bg-purple-500 hover:bg-purple-600">
              <Crown className="h-4 w-4" />
              Studio Plus
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}
