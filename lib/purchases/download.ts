import { createAdminClient } from "../database/supabase.client"
import { recordDownload, incrementPackCounter } from "../database/queries"
import { logger } from "../utils/logger"
import { createLimitNotification } from "../notifications/limit-notifications"

export async function downloadPackFile(packId: string, userId: string, fileUrl: string): Promise<Blob> {
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

  // Record download
  await recordDownload(userId, packId)

  // Increment counter
  await incrementPackCounter(packId, "downloads_count")

  await createLimitNotification(userId, "download")

  logger.info("Pack downloaded", "DOWNLOAD", { packId, userId })

  return fileData
}

export function generateDownloadFilename(title: string): string {
  return `${title.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_")}.zip`
}
