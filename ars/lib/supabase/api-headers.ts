export function getApiHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
    "Content-Type": "application/json",
  }
}

export function createApiResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: getApiHeaders(),
  })
}

export function createApiError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: getApiHeaders(),
  })
}
