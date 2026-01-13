"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface PlanPricing {
  plan_id: string
  base_price: number
  current_price: number
  is_discounted: boolean
  discount_label: string | null
}

export function usePlanPricing() {
  const [pricing, setPricing] = useState<Record<string, PlanPricing>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase.from("plan_pricing").select("*")

      if (error) throw error

      // Convert array to record for easy lookup
      const pricingRecord: Record<string, PlanPricing> = {}
      data?.forEach((plan) => {
        pricingRecord[plan.plan_id] = plan
      })

      setPricing(pricingRecord)
    } catch (err) {
      setError(err as Error)
      console.error("[v0] Error fetching plan pricing:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanPrice = (planId: string): number => {
    return pricing[planId]?.current_price || 0
  }

  const getPlanBasePrice = (planId: string): number => {
    return pricing[planId]?.base_price || 0
  }

  const isPlanDiscounted = (planId: string): boolean => {
    return pricing[planId]?.is_discounted || false
  }

  const getDiscountLabel = (planId: string): string | null => {
    return pricing[planId]?.discount_label || null
  }

  return {
    pricing,
    isLoading,
    error,
    getPlanPrice,
    getPlanBasePrice,
    isPlanDiscounted,
    getDiscountLabel,
    refresh: fetchPricing,
  }
}
