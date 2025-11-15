"use client"

import { useEffect } from "react"

export function DbInitializer() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const response = await fetch("/api/init", {
          method: "GET",
          cache: "no-store",
        })

        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Database ready:", data.message)
        }
      } catch (error) {
        console.error("[v0] Database init error:", error)
        // Silently fail - database may already be initialized
      }
    }

    initializeDatabase()
  }, [])

  return null
}
