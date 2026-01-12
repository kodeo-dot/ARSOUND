export interface PackOffer {
  id: string
  pack_id: string
  discount_percent: number
  start_date: string
  end_date: string
  created_at: string
}

export interface DiscountValidation {
  isValid: boolean
  message: string
  percent?: number
}

export function validateDiscountCode(code: string, percent: string): DiscountValidation {
  const percentNum = Number.parseInt(percent)

  // Check for comma
  if (percent.includes(",")) {
    return {
      isValid: false,
      message: "El porcentaje no puede contener comas. Usa solo números enteros.",
    }
  }

  // Check minimum
  if (percentNum < 5) {
    return {
      isValid: false,
      message: "El descuento mínimo es 5%",
    }
  }

  // Check if it's a valid integer
  if (isNaN(percentNum) || percentNum !== Number.parseFloat(percent)) {
    return {
      isValid: false,
      message: "Ingresa un número entero válido",
    }
  }

  return {
    isValid: true,
    message: "Código válido",
    percent: percentNum,
  }
}
