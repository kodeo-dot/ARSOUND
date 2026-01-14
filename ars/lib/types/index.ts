export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  instagram: string | null
  twitter: string | null
  soundcloud: string | null
  followers_count: number
  total_sales: number
  packs_count: number
  created_at: string
  total_plays_count: number
  total_likes_received: number
  plan: PlanType
  mp_connected?: boolean
  mp_user_id?: string | null
}

export type PlanType = "free" | "de_0_a_hit" | "studio_plus"

export interface Purchase {
  id: string
  purchase_code: string
  pack_id: string
  amount: number
  discount_amount: number
  discount_code: string | null
  discount_percent: number | null
  payment_method: string
  status: string
  created_at: string
  packs: {
    id: string
    title: string
    cover_image_url: string | null
    price: number
    user_id: string
  } | null
}

export interface UserTrackEvent {
  id: string
  user_id: string
  track_id: string
  played: boolean
  downloaded: boolean
  purchased: boolean
  liked: boolean
  created_at: string
  updated_at: string
}

export interface PackPlay {
  id: string
  user_id: string
  pack_id: string
  played_at: string
  ip_address: string
}
