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
  'typeface', 'typefont'
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

export async function POST(req: NextRequest) {
  const { action, password, ids } = await req.json()

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
