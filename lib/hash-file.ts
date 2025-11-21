import crypto from "crypto"

/**
 * Descarga un archivo desde una URL y genera su hash SHA-256
 * @param url - URL del archivo (generalmente desde Supabase Storage)
 * @returns Promise con el hash SHA-256 en formato hexadecimal
 */
export async function hashFileFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const hash = crypto.createHash("sha256").update(buffer).digest("hex")

    return hash
  } catch (error) {
    console.error("[v0] Error hashing file from URL:", error)
    throw error
  }
}
