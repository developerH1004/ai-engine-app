import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234'

export async function POST(req: NextRequest) {
  const { url, password } = await req.json()
  if (password !== ADMIN_PASSWORD) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!url) return NextResponse.json({ status: 'error', error: 'No URL' })

  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIMapBot/1.0)' }
    })
    if (res.ok || res.status === 405) {
      return NextResponse.json({ status: 'ok', statusCode: res.status })
    } else {
      return NextResponse.json({ status: 'dead', statusCode: res.status })
    }
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e.message || 'timeout' })
  }
}
