import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'

export async function POST(req: NextRequest) {
  const { url, product_name, manufacturer, password } = await req.json()
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!url) return NextResponse.json({ match: false, reason: 'No URL' })

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMapBot/1.0)' }
    })

    if (!res.ok) {
      return NextResponse.json({ match: false, reason: `HTTP ${res.status}` })
    }

    const html = await res.text()
    const text = html.toLowerCase()

    // 제품명 키워드 추출 (숫자/특수문자 제거, 단어 분리)
    const productWords = product_name.toLowerCase()
      .replace(/[^a-z0-9\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    const makerWords = (manufacturer || '').toLowerCase()
      .replace(/[^a-z0-9\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length > 2)

    // 매칭 점수 계산
    let score = 0
    const matched: string[] = []
    const notMatched: string[] = []

    for (const word of productWords) {
      if (text.includes(word)) { score += 2; matched.push(word) }
      else notMatched.push(word)
    }
    for (const word of makerWords) {
      if (text.includes(word)) { score += 1; matched.push(word) }
    }

    const threshold = Math.max(2, productWords.length)
    const isMatch = score >= threshold

    return NextResponse.json({
      match: isMatch,
      score,
      threshold,
      matched,
      notMatched,
      reason: isMatch
        ? `✅ 키워드 ${matched.length}개 일치`
        : `⚠️ 키워드 불일치 (${matched.length}/${productWords.length + makerWords.length})`
    })
  } catch (e: any) {
    return NextResponse.json({ match: false, reason: e.message || 'timeout' })
  }
}
