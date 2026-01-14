import { logger } from "../utils/logger"

export async function hashFileFromUrl(fileUrl: string): Promise<string> {
  try {
    logger.debug("Fetching file for hashing", "STORAGE", { fileUrl })

    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    logger.debug("File hash generated", "STORAGE", { hash: hashHex.substring(0, 16) })

    return hashHex
  } catch (error) {
    logger.error("Error hashing file", "STORAGE", error)
    throw new Error("Failed to generate file hash")
  }
}
