"use client"

import { useEffect } from "react"

export function useDbInit() {
  useEffect(() => {
    const initDb = async () => {
      try {
        const response = await fetch("/api/init")
        if (response.ok) {
          const data = await response.json()
          console.log("[v0] Database initialization:", data.message)
        }
      } catch (error) {
        console.error("[v0] Database initialization error:", error)
      }
    }

    initDb()
  }, [])
}
