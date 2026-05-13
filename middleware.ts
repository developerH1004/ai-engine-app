import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// 인증 없이 접근 가능한 페이지
const PUBLIC_PATHS = ['/auth', '/api', '/_next', '/favicon.ico', '/public']

// 마스터 코드 (관리자용 - 환경변수로 관리)
const MASTER_CODE = process.env.MASTER_SERIAL_CODE || 'MASTER-DEVEL-OPER-H004'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // 인증 쿠키 확인
  const verified = request.cookies.get('ai_map_verified')?.value

  if (!verified || verified !== 'true') {
    // 미인증 → 인증 페이지로 리다이렉트
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
