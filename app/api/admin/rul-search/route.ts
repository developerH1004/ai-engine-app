import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'
const GOOGLE_API_KEY = process.env.GOOGLE_SEARCH_API_KEY || ''
const GOOGLE_CX      = process.env.GOOGLE_SEARCH_CX || ''

export async function POST(req: NextRequest) {
  const { product_name, manufacturer, password } = await req.json()
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Google Custom Search API가 설정된 경우
  if (GOOGLE_API_KEY && GOOGLE_CX) {
    try {
      const query = encodeURIComponent(`${product_name} ${manufacturer} official site`)
      const res = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&num=3`,
        { signal: AbortSignal.timeout(8000) }
      )
      const data = await res.json()
      const items = data.items || []
      const candidates = items.map((item: any) => ({
        url: item.link,
        title: item.title,
        snippet: item.snippet,
      }))
      return NextResponse.json({ candidates })
    } catch (e: any) {
      return NextResponse.json({ error: e.message, candidates: [] })
    }
  }

  // Google API 없을 때 — 제조사 도메인 추론 (휴리스틱)
  const candidates = inferUrls(product_name, manufacturer)
  return NextResponse.json({ candidates, note: 'Google API 미설정 — 도메인 추론 결과' })
}

// 제조사명으로 URL 추론
function inferUrls(product: string, maker: string): { url: string; title: string; snippet: string }[] {
  if (!maker) return []
  const slug = maker.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '')

  const results = []

  // HuggingFace 패턴
  if (slug.includes('hugging') || slug.includes('hf')) {
    results.push({ url: `https://huggingface.co/${product.replace(/\s/g, '-')}`, title: product, snippet: 'HuggingFace model page' })
  }

  // GitHub 패턴
  results.push({ url: `https://github.com/${slug}/${product.toLowerCase().replace(/\s/g, '-')}`, title: product, snippet: 'GitHub repo (추론)' })

  // 공식 도메인 추론
  results.push({ url: `https://www.${slug}.com`, title: maker, snippet: '제조사 공식 홈 (추론)' })
  results.push({ url: `https://www.${slug}.ai`, title: maker, snippet: '제조사 AI 도메인 (추론)' })

  return results.slice(0, 3)
}
