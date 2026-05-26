import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'

export async function POST(req: NextRequest) {
  const { url, product_name, manufacturer, password } = await req.json()
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!url) return NextResponse.json({ match: false, makerMatch: false, reason: 'No URL' })

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMapBot/1.0)' }
    })

    if (!res.ok) {
      return NextResponse.json({ match: false, makerMatch: false, reason: `HTTP ${res.status}` })
    }

    const html = await res.text()
    const text = html.toLowerCase()

    // 제품명 키워드 추출
    const productWords = product_name.toLowerCase()
      .replace(/[^a-z0-9\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    const makerWords = (manufacturer || '').toLowerCase()
      .replace(/[^a-z0-9\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    // 제품명 매칭
    let productScore = 0
    const matched: string[] = []
    const notMatched: string[] = []
    for (const word of productWords) {
      if (text.includes(word)) { productScore += 2; matched.push(word) }
      else notMatched.push(word)
    }

    // 제조사 매칭 (페이지 텍스트 + URL 도메인 둘 다 체크)
    let makerScore = 0
    const makerMatched: string[] = []
    const domain = url.toLowerCase().replace(/https?:\/\//, '').split('/')[0]
    for (const word of makerWords) {
      if (text.includes(word) || domain.includes(word)) {
        makerScore++
        makerMatched.push(word)
      }
    }

    const productThreshold = Math.max(2, productWords.length)
    const isProductMatch = productScore >= productThreshold
    const isMakerMatch = makerWords.length === 0 || makerScore > 0

    // 분류:
    // match=true → 제품+제조사 일치
    // match=false, makerMatch=true → 불일치/일치 (제조사는 맞는데 제품 페이지 아님)
    // match=false, makerMatch=false → 불일치/불일치 (둘 다 안 맞음)

    let reason = ''
    if (isProductMatch) {
      reason = `✅ 제품 키워드 ${matched.length}개 일치`
    } else if (isMakerMatch) {
      reason = `⚠️ 제조사 일치, 제품 키워드 불일치 (${matched.length}/${productWords.length})`
    } else {
      reason = `❌ 제품·제조사 모두 불일치 (${matched.length}/${productWords.length + makerWords.length})`
    }

    return NextResponse.json({
      match: isProductMatch,
      makerMatch: isMakerMatch,
      score: productScore,
      threshold: productThreshold,
      matched,
      makerMatched,
      notMatched,
      reason
    })
  } catch (e: any) {
    return NextResponse.json({ match: false, makerMatch: false, reason: e.message || 'timeout' })
  }
}
