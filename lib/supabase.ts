import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type AIProduct = {
  id: number
  category_main: string
  category_sub: string
  country: string
  manufacturer: string
  product_name: string
  description: string
  official_url: string
  verification_status: string
  is_research_model: boolean
  created_at: string
  updated_at: string
  versions?: AIVersion[]
}

export type AIVersion = {
  id: number
  product_id: number
  version_name: string
  is_active: boolean
  sort_order: number
}
