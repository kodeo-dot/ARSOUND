import { createAdminClient } from "../database/supabase.client"
import { recordDownload, incrementPackCounter } from "../database/queries"
import { logger } from "../utils/logger"
import { LICENSE_FULL_TEXT } from "../config/license.config"
import JSZip from "jszip"

async function generateLicensePDF(packTitle: string, buyerEmail: string): Promise<Blob> {
  const licenseText = LICENSE_FULL_TEXT.replace("[TU EMAIL DE CONTACTO]", "soporte@arsound.com.ar")
  const content = `
LICENCIA DE USO - ${packTitle}

Comprador: ${buyerEmail}
Fecha de compra: ${new Date().toLocaleDateString("es-AR")}

${licenseText}
  `

  return new Blob([content], { type: "text/plain" })
}

export async function downloadPackFile(
  packId: string,
  userId: string,
  fileUrl: string,
  packTitle: string,
  userEmail: string,
): Promise<Blob> {
  const adminSupabase = await createAdminClient()

  // Extract file path from URL
  const url = new URL(fileUrl)
  const cleanPath = url.pathname.split("/samplepacks/")[1]

  if (!cleanPath) {
    throw new Error("Invalid file URL")
  }

  logger.debug("Downloading pack file", "DOWNLOAD", { packId, userId, path: cleanPath })

  // Download from storage
  const { data: fileData, error } = await adminSupabase.storage.from("samplepacks").download(cleanPath)

  if (error || !fileData) {
    logger.error("Error downloading file from storage", "DOWNLOAD", error)
    throw new Error("Error al descargar el archivo")
  }

  // Generate license PDF
  const licensePDF = await generateLicensePDF(packTitle, userEmail)

  // Create a new ZIP containing the original pack + license
  const zip = new JSZip()
  zip.file(`${packTitle}.zip`, fileData)
  zip.file(`${packTitle}_license.txt`, licensePDF)

  const finalZip = await zip.generateAsync({ type: "blob" })

  // Record download
  await recordDownload(userId, packId)

  // Increment counter
  await incrementPackCounter(packId, "downloads_count")

  logger.info("Pack downloaded with license", "DOWNLOAD", { packId, userId })

  return finalZip
}

export function generateDownloadFilename(title: string): string {
  return `${title.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_")}_with_license.zip`
}
