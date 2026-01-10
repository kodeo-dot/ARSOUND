import { requireSession } from "@/lib/auth/session"
import { validatePackDownload } from "@/lib/purchases/validator"
import { downloadPackFile, generateDownloadFilename } from "@/lib/purchases/download"
import { errorResponse } from "@/lib/utils/response"
import { handleApiError } from "@/lib/utils/errors"
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/database/supabase.client"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireSession()
    const { id: packId } = await context.params

    // Validate download permission
    const validation = await validatePackDownload(user.id, packId)

    if (!validation.canDownload) {
      return errorResponse(validation.reason || "No autorizado", 403)
    }

    const pack = validation.pack

    const supabase = await createServerClient()
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single()

    const userEmail = profile?.email || user.email || "usuario@arsound.com"

    // Download file with license
    const fileData = await downloadPackFile(packId, user.id, pack.file_url, pack.title, userEmail)

    // Convert to buffer
    const buffer = await fileData.arrayBuffer()

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${generateDownloadFilename(pack.title)}"`,
      },
    })
  } catch (error) {
    const errorDetails = handleApiError(error)
    return errorResponse(errorDetails.message, errorDetails.statusCode)
  }
}
