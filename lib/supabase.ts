import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type AIProduct = {
  id: number
  category_main: string
  category_sub:  string
  country:      string
  manufacturer: string
  product_name: string
  service_type:    string
  parent_platform: string
  base_model:      string
  product_family:  string
  modality:        string
  service_region:  string
  description:  string
  official_url: string
  verification_status:   string
  pricing_type:          string
  subscription_plan:     string
  monthly_fee_usd:       number
  api_pricing:           string
  service_accessibility: string
  category_main_ko:  string
  category_sub_ko:   string
  country_ko:        string
  service_type_ko:   string
  modality_ko:       string
  service_region_ko: string
  description_ko:    string
  verification_ko:   string
  pricing_type_ko:   string
  subscription_ko:   string
  api_pricing_ko:    string
  accessibility_ko:  string
  is_research_model: boolean
  created_at:        string
  updated_at:        string

  // ── Setup / Install 필드 (v4 신규) ──
  install_type:      string | null   // "SaaS (Web-Based)", "Local Native (On-Premise)", etc.
  sys_req_en:        string | null
  sys_req_kr:        string | null
  setup_guide_en:    string | null
  setup_guide_kr:    string | null
  env_config_en:     string | null
  env_config_kr:     string | null
  expert_focus_en:   string | null
  expert_focus_kr:   string | null
  has_prompt_book:   boolean | null

  versions?: AIVersion[]
}

export type AIVersion = {
  id:           number
  product_id:   number
  version_name: string
  is_active:    boolean
  sort_order:   number
}
