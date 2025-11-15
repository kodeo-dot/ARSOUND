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
  plan: 'free' | 'de_0_a_hit' | 'studio_plus'
  mp_connected: boolean
  mp_user_id: string | null
  mp_access_token: string | null
}
