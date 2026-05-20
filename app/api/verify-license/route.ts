import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel 환경 변수에서 로드
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// [중요] 여기에 검로드 상품 페이지 URL의 마지막 슬러그를 정확히 입력하세요.
// 예: gumroad.com/l/abcde 라면 'abcde'가 슬러그입니다.
const GUMROAD_PRODUCT_PERMALINK = 'gait69'; 

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    if (!licenseKey || !userId) {
      return NextResponse.json({ success: false, message: '키 또는 ID가 없습니다.' }, { status: 400 });
    }
    
    // 1. 검로드 API 호출
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: GUMROAD_PRODUCT_PERMALINK,
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 검로드 API 응답이 실패하거나 success가 false인 경우
    if (!gumroadResponse.ok || !gumroadData.success) {
      console.error('Gumroad API Error:', gumroadData);
      return NextResponse.json({ success: false, message: '검로드 인증 실패: 키가 유효하지 않습니다.' }, { status: 400 });
    }

    // 2. Supabase 데이터베이스에 라이선스 정보 저장
    // [주의] 아래 테이블명(users_license)과 컬럼명이 Supabase와 정확히 일치해야 합니다.
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) {
      console.error('Supabase Insert Error:', error);
      return NextResponse.json({ success: false, message: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API Server Error:', err);
    return NextResponse.json({ success: false, message: '서버 내부 오류 발생' }, { status: 500 });
  }
}