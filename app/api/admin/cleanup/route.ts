// app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'devH2026!'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const INVALID_KEYWORDS = [
  'font', 'gguf-font', 'not-a-language-model',
  'monospace', 'glyph', 'bezier', 'rasterization',
  'typeface', 'typefont', '0xproto', 'nerd-font',
  'ligature', 'codepoint', 'bitmap', 'truetype', 'opentype',
]

async function getAllProducts() {
  const all: any[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('ai_products')
      .select('id, product_name, manufacturer, official_url, verification_status, parent_platform, created_at')
      .range(offset, offset + 999)
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < 1000) break
    offset += 1000
  }
  return all
}

// 날짜 파싱: YYMMDD 또는 YYYY-MM-DD 모두 지원
function parseDate(input: string): string {
  const trimmed = input.trim().replace(/\s/g, '')
  // YYMMDD 형식 (6자리 숫자)
  if (/^\d{6}$/.test(trimmed)) {
    return `20${trimmed.slice(0,2)}-${trimmed.slice(2,4)}-${trimmed.slice(4,6)}`
  }
  // YYMMDD-YYMMDD 범위 입력 시 앞부분만 사용 (백오피스는 별도 필드로 분리)
  const rangeMatch = trimmed.match(/^(\d{6})-(\d{6})$/)
  if (rangeMatch) {
    return `20${rangeMatch[1].slice(0,2)}-${rangeMatch[1].slice(2,4)}-${rangeMatch[1].slice(4,6)}`
  }
  // YYYY-MM-DD 형식
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  return trimmed
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, password, ids, dateFrom, dateTo } = body

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호 오류' }, { status: 401 })
  }

  // ── 비AI/폰트 탐지 ──────────────────────────────────────
  if (action === 'find_invalid') {
    const products = await getAllProducts()
    const invalid = products.filter(p => {
      const name = (p.product_name || '').toLowerCase()
      const url  = (p.official_url  || '').toLowerCase()
      return INVALID_KEYWORDS.some(kw => name.includes(kw) || url.includes(kw))
    })
    return NextResponse.json({ results: invalid, count: invalid.length })
  }

  // ── 중복 탐지 ────────────────────────────────────────────
  if (action === 'find_duplicates') {
    const products = await getAllProducts()
    const seen: Record<string, any> = {}
    const duplicates: any[] = []
    for (const p of products) {
      const key = (p.product_name || '').toLowerCase().trim()
      if (seen[key]) {
        duplicates.push({ ...p, _duplicate_of_id: seen[key].id, _reason: '중복 product_name' })
      } else {
        seen[key] = p
      }
    }
    return NextResponse.json({ results: duplicates, count: duplicates.length })
  }

  // ── 날짜 범위 검색 ───────────────────────────────────────
  if (action === 'date_search') {
    if (!dateFrom) return NextResponse.json({ error: '시작 날짜 필요' }, { status: 400 })

    const from = parseDate(dateFrom)
    const to   = parseDate(dateTo || dateFrom)

    // to 날짜 +1일
    const toDate = new Date(to)
    toDate.setDate(toDate.getDate() + 1)
    const toNext = toDate.toISOString().slice(0, 10)

    const SELECT = 'id, product_name, manufacturer, category_main, category_main_ko, created_at, updated_at, verification_status, parent_platform, official_url'

    // 신규
    const { data: newItems, error: e1 } = await supabase
      .from('ai_products')
      .select(SELECT)
      .gte('created_at', `${from}T00:00:00`)
      .lt('created_at',  `${toNext}T00:00:00`)
      .order('created_at', { ascending: false })

    // 업데이트 (신규 제외)
    const { data: updatedItems, error: e2 } = await supabase
      .from('ai_products')
      .select(SELECT)
      .gte('updated_at', `${from}T00:00:00`)
      .lt('updated_at',  `${toNext}T00:00:00`)
      .lt('created_at',  `${from}T00:00:00`)
      .order('updated_at', { ascending: false })

    if (e1 || e2) {
      return NextResponse.json({ error: (e1 || e2)?.message }, { status: 500 })
    }

    const newList     = (newItems     || []).map((r: any) => ({ ...r, _type: '신규' }))
    const updatedList = (updatedItems || []).map((r: any) => ({ ...r, _type: '수정' }))

    return NextResponse.json({
      results:      [...newList, ...updatedList],
      newCount:     newList.length,
      updatedCount: updatedList.length,
      from,
      to,
    })
  }

  // ── 선택 삭제 ────────────────────────────────────────────
  if (action === 'delete_items') {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids 필요' }, { status: 400 })
    }
    const { error } = await supabase
      .from('ai_products')
      .delete()
      .in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: ids.length })
  }

  // ── 통계 ────────────────────────────────────────────────
  if (action === 'stats') {
    const { count: total } = await supabase
      .from('ai_products')
      .select('id', { count: 'exact', head: true })
    const { count: today } = await supabase
      .from('ai_products')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().slice(0, 10))
    const { count: glossary } = await supabase
      .from('glossary')
      .select('term_id', { count: 'exact', head: true })
    return NextResponse.json({ total, today, glossary })
  }

  return NextResponse.json({ error: '알 수 없는 action' }, { status: 400 })
}
