type LogLevel = "info" | "warn" | "error" | "debug"

interface LogData {
  level: LogLevel
  message: string
  context?: string
  data?: unknown
  timestamp: string
}

function log(level: LogLevel, message: string, context?: string, data?: unknown) {
  const logData: LogData = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  }

  const prefix = context ? `[${context}]` : "[ARSOUND]"

  switch (level) {
    case "error":
      console.error(prefix, message, data || "")
      break
    case "warn":
      console.warn(prefix, message, data || "")
      break
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.log(prefix, message, data || "")
      }
      break
    default:
      console.log(prefix, message, data || "")
  }
}

export const logger = {
  info: (message: string, context?: string, data?: unknown) => log("info", message, context, data),
  warn: (message: string, context?: string, data?: unknown) => log("warn", message, context, data),
  error: (message: string, context?: string, data?: unknown) => log("error", message, context, data),
  debug: (message: string, context?: string, data?: unknown) => log("debug", message, context, data),
}
