import { NextResponse } from "next/server"
import type { ApiResponse } from "../types/api.types"

export function successResponse<T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status },
  )
}

export function errorResponse(error: string, status = 500, details?: unknown): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status },
  )
}

export function validationErrorResponse(message: string, fields?: string[]): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: fields ? { missing_fields: fields } : undefined,
    },
    { status: 400 },
  )
}
