// ============================================================
// 날짜 범위 검색 기능 — date_range_search.ts
// lib/date_range_search.ts
// ============================================================
// 사용법: 검색창에 아래 형식으로 입력
//   260520-260524  → 2026-05-20 ~ 2026-05-24 변경 내역
//   260524         → 2026-05-24 단일 날짜
// ============================================================

import { supabase, AIProduct } from './supabase'

// ── 타입 ─────────────────────────────────────────────────────
export interface DateRange {
  from: string   // "2026-05-20"
  to:   string   // "2026-05-24"
}

export interface DateRangeResult extends Partial<AIProduct> {
  _change_type: '신규 추가' | '업데이트'
}

// ── 날짜 파싱 ────────────────────────────────────────────────
function parseShortDate(yymmdd: string): string {
  const yy = yymmdd.slice(0, 2)
  const mm = yymmdd.slice(2, 4)
  const dd = yymmdd.slice(4, 6)
  return `20${yy}-${mm}-${dd}`
}

/**
 * "260520-260524" → { from: "2026-05-20", to: "2026-05-24" }
 * "260524"        → { from: "2026-05-24", to: "2026-05-24" }
 * 날짜 형식 아니면 null 반환
 */
export function parseDateRangeQuery(query: string): DateRange | null {
  const trimmed = query.trim().replace(/\s/g, '')

  // YYMMDD-YYMMDD (범위)
  const rangeMatch = trimmed.match(/^(\d{6})-(\d{6})$/)
  if (rangeMatch) {
    return {
      from: parseShortDate(rangeMatch[1]),
      to:   parseShortDate(rangeMatch[2]),
    }
  }

  // YYMMDD (단일)
  const singleMatch = trimmed.match(/^(\d{6})$/)
  if (singleMatch) {
    const d = parseShortDate(singleMatch[1])
    return { from: d, to: d }
  }

  return null
}

// ── Supabase 쿼리 ────────────────────────────────────────────
export async function fetchByDateRange(
  range: DateRange
): Promise<DateRangeResult[]> {
  const { from, to } = range

  // to 날짜 +1일 (해당일 끝까지 포함)
  const toDate = new Date(to)
  toDate.setDate(toDate.getDate() + 1)
  const toNext = toDate.toISOString().slice(0, 10)

  const SELECT_FIELDS = [
    'id', 'product_name', 'manufacturer',
    'category_main', 'category_main_ko',
    'category_sub',  'category_sub_ko',
    'modality', 'pricing_type',
    'official_url', 'verification_status',
    'created_at', 'updated_at',
    'parent_platform', 'country',
  ].join(', ')

  const results: DateRangeResult[] = []

  // 1. 신규 추가 (created_at 기준)
  const { data: newItems } = await supabase
    .from('ai_products')
    .select(SELECT_FIELDS)
    .gte('created_at', `${from}T00:00:00`)
    .lt('created_at',  `${toNext}T00:00:00`)
    .order('created_at', { ascending: false })

  if (newItems) {
    newItems.forEach((r: any) => results.push({ ...r, _change_type: '신규 추가' }))
  }

  // 2. 업데이트 (updated_at 기준, 신규 제외)
  const { data: updatedItems } = await supabase
    .from('ai_products')
    .select(SELECT_FIELDS)
    .gte('updated_at', `${from}T00:00:00`)
    .lt('updated_at',  `${toNext}T00:00:00`)
    .lt('created_at',  `${from}T00:00:00`)   // 신규 제외
    .order('updated_at', { ascending: false })

  if (updatedItems) {
    updatedItems.forEach((r: any) => results.push({ ...r, _change_type: '업데이트' }))
  }

  // 중복 제거 (id 기준)
  const seen = new Set<number>()
  return results.filter(r => {
    if (seen.has(r.id!)) return false
    seen.add(r.id!)
    return true
  })
}

// ── 요약 통계 ────────────────────────────────────────────────
export function summarizeDateRangeResults(results: DateRangeResult[]) {
  return {
    total:      results.length,
    newCount:   results.filter(r => r._change_type === '신규 추가').length,
    updatedCount: results.filter(r => r._change_type === '업데이트').length,
  }
}
