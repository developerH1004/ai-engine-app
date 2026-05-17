import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type AIProduct = {
  id: number

  // 영문 분류
  category_main: string
  category_sub:  string

  // 기본
  country:      string
  manufacturer: string
  product_name: string

  // 서비스
  service_type:    string
  parent_platform: string
  base_model:      string
  product_family:  string
  modality:        string
  service_region:  string

  // 설명
  description:  string   // Expert_Analysis (영문)
  official_url: string

  // 요금
  verification_status:  string
  pricing_type:         string
  subscription_plan:    string
  monthly_fee_usd:      number
  api_pricing:          string
  service_accessibility: string

  // 한글 필드
  category_main_ko:  string
  category_sub_ko:   string
  country_ko:        string
  service_type_ko:   string
  modality_ko:       string
  service_region_ko: string
  description_ko:    string   // 한글 전문가 분析
  verification_ko:   string
  pricing_type_ko:   string
  subscription_ko:   string
  api_pricing_ko:    string
  accessibility_ko:  string

  // 메타
  is_research_model: boolean
  created_at:        string
  updated_at:        string

  // 조인
  versions?: AIVersion[]
}

export type AIVersion = {
  id:           number
  product_id:   number
  version_name: string
  is_active:    boolean
  sort_order:   number
}
