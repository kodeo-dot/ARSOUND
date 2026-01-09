export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode = 500,
    public details?: unknown,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "AUTH_ERROR", 401)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN", 403)
  }
}

export class PaymentError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "PAYMENT_ERROR", 500, details)
  }
}

export function handleApiError(error: unknown): {
  message: string
  code: string
  statusCode: number
  details?: unknown
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    }
  }

  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  }
}
