export interface UserAction {
  id: string
  user_id: string
  pack_id: string
  action_type: 'play' | 'download' | 'purchase' | 'like'
  created_at: string
}

export interface PurchaseDetails {
  id: string
  purchase_code: string
  buyer_id: string
  pack_id: string
  amount: number
  discount_amount?: number
  discount_code_used?: string
  discount_percent_applied?: number
  payment_method: string
  status: string
  mercado_pago_payment_id?: string
  created_at: string
  pack: {
    id: string
    title: string
    cover_image_url: string | null
    user_id: string
  }
}

export interface MonthlyPackStats {
  pack_id: string
  title: string
  cover_image_url: string | null
  price: number
  monthly_sales: number
  total_plays: number
  producer_username: string
  producer_avatar: string | null
}
