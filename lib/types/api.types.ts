import type { PurchaseStatus } from "./database.types"

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface UploadPackRequest {
  title: string
  description: string
  genre: string
  subgenre?: string
  bpm?: string | null
  product_type?: "sample_pack" | "midi_pack" | "preset"
  daw_compatibility?: string[]
  plugin?: string | null
  price: number
  tags?: string[]
  cover_image_url?: string
  demo_audio_url: string
  file_url: string
  has_discount?: boolean
  discount_percent?: number
  discountCode?: string
  discountType?: "all" | "first" | "followers"
  discountRequiresCode?: boolean
}

export interface CreatePreferenceRequest {
  packId?: string
  planType?: string
  discountCode?: string
}

export interface CreatePreferenceResponse {
  init_point: string
  preference_id: string
}

export interface PurchaseDetailsResponse {
  id: string
  pack_title: string
  pack_cover_image: string | null
  seller_username: string
  amount: number
  status: PurchaseStatus
  purchase_code: string
  created_at: string
}

export interface AnalyticsResponse {
  total_plays: number
  total_sales: number
  total_revenue: number
  packs_count: number
  conversion_rate: number
  plays_by_country: Record<string, number>
  sales_by_country: Record<string, number>
  activity_by_hour: { hour: number; plays: number; sales: number }[]
}
