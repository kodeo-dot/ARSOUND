export type PlanType = "free" | "de_0_a_hit" | "studio_plus"

export type PackStatus = "published" | "draft" | "archived"

export type PurchaseStatus = "pending" | "completed" | "failed" | "refunded"

export type PaymentMethod = "mercado_pago" | "stripe" | "manual"

export type AppealStatus = "pending" | "approved" | "rejected"

export interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  plan: PlanType
  packs_count: number
  followers_count: number
  total_sales: number
  mp_access_token: string | null
  mp_user_id: string | null
  mp_connected: boolean
  is_blocked: boolean
  blocked_reason: string | null
  blocked_at: string | null
  created_at: string
  updated_at: string
}

export interface Pack {
  id: string
  user_id: string
  title: string
  description: string
  genre: string
  subgenre: string
  bpm: number | null
  product_type: "sample_pack" | "midi_pack" | "preset"
  daw_compatibility: string[]
  plugin: string | null
  price: number
  cover_image_url: string | null
  demo_audio_url: string
  file_url: string
  file_hash: string
  tags: string[]
  has_discount: boolean
  discount_percent: number
  status: PackStatus
  likes_count: number
  downloads_count: number
  total_plays: number
  created_at: string
  updated_at: string
}

export interface Purchase {
  id: string
  buyer_id: string
  seller_id: string
  pack_id: string
  amount: number
  discount_amount: number
  platform_commission: number
  creator_earnings: number
  status: PurchaseStatus
  payment_method: PaymentMethod
  mercado_pago_payment_id: string | null
  stripe_payment_id: string | null
  purchase_code: string
  created_at: string
}

export interface DiscountCode {
  id: string
  pack_id: string
  code: string
  discount_percent: number
  expires_at: string | null
  max_uses: number | null
  uses_count: number
  for_all_users: boolean
  for_first_purchase: boolean
  for_followers: boolean
  created_at: string
}

export interface UserPlan {
  id: string
  user_id: string
  plan_type: PlanType
  is_active: boolean
  started_at: string
  expires_at: string | null
}

export interface Appeal {
  id: string
  user_id: string
  message: string
  status: AppealStatus
  reviewed_by: string | null
  reviewed_at: string | null
  admin_notes: string | null
  created_at: string
}

export interface PackDownload {
  id: string
  user_id: string
  pack_id: string
  downloaded_at: string
}

export interface PackPlay {
  id: string
  user_id: string | null
  pack_id: string
  played_at: string
  ip_address: string | null
  country: string | null
  city: string | null
}

export interface ReuploadAttempt {
  id: string
  user_id: string
  file_hash: string
  attempt_count: number
  blocked_at: string | null
  created_at: string
  updated_at: string
}

export type DAWType =
  | "FL Studio"
  | "Ableton Live"
  | "Logic Pro"
  | "Cubase"
  | "Reaper"
  | "Pro Tools"
  | "Studio One"
  | "Bitwig"
  | "Universal"
