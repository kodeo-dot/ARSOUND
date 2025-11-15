export type DiscountType = "general" | "follower" | "first_purchase"

export interface DiscountCode {
  code: string
  type: DiscountType
  percentage: number
  isValid: boolean
  errorMessage?: string
}

export interface PriceBreakdown {
  basePrice: number
  discountAmount: number
  discountPercentage: number
  platformCommission: number
  platformCommissionAmount: number
  totalToPay: number
  creatorEarnings: number
}
