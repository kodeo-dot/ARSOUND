import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

/**
 * Health check endpoint to verify all systems are operational
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data: dbTest, error: dbError } = await supabase
      .from("profiles")
      .select("count", { count: "exact" })
      .limit(1)

    if (dbError) {
      return NextResponse.json(
        {
          status: "database_error",
          error: dbError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    const { data: storageList, error: storageError } = await supabase.storage
      .from("samplepacks")
      .list("", { limit: 1 })

    if (storageError) {
      return NextResponse.json(
        {
          status: "storage_error",
          error: storageError.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      storage: "accessible",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
