import { NextRequest, NextResponse } from 'next/server'

// 인증이 필요한 경로 없음 — 페이월은 클라이언트(ProductCard)에서 처리
// middleware는 정적 파일 통과만 담당

export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
