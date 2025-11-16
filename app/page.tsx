"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { PackGrid } from "@/components/pack-grid"
import { FeaturedProducers } from "@/components/featured-producers"
import { AudioPlayer } from "@/components/audio-player"
import { TopMonthlyPacks } from "@/components/top-monthly-packs"
import { Footer } from "@/components/footer"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const [producersLoading, setProducersLoading] = useState(true)
  const [topProducers, setTopProducers] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchTopProducers() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, bio, followers_count")
          .order("followers_count", { ascending: false })
          .limit(6)

        if (error) throw error
        setTopProducers(data || [])
      } catch (error) {
        console.error("Error fetching producers:", error)
        setTopProducers([])
      } finally {
        setProducersLoading(false)
      }
    }

    fetchTopProducers()
  }, [])

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <PackGrid />
      <TopMonthlyPacks />
      <FeaturedProducers />
      <AudioPlayer />
      <Footer />
    </div>
  )
}
