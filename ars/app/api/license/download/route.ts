import { NextResponse } from "next/server"
import { LICENSE_FULL_TEXT, LICENSE_CONFIG } from "@/lib/config/license.config"

export async function GET() {
  try {
    // In a real implementation, you would generate a proper PDF here
    // For now, we'll return a text file that can be converted to PDF

    const content = LICENSE_FULL_TEXT

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="ARSOUND_Licencia_v${LICENSE_CONFIG.version}.txt"`,
      },
    })
  } catch (error) {
    console.error("[v0] License download error:", error)
    return NextResponse.json({ error: "Error al generar la licencia" }, { status: 500 })
  }
}
