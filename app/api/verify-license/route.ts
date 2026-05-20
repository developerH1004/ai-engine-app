import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  return createClient(url, key);
};

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    if (!licenseKey || !userId) {
      return NextResponse.json({ success: false, message: '키 또는 ID가 없습니다.' }, { status: 400 });
    }

    // 1. 검로드 API 검증
    // 에러 유발 파라미터 제거 및 URLSearchParams 객체 명시적 사용
    const params = new URLSearchParams();
    params.append('product_permalink', 'gait69');
    params.append('license_key', licenseKey.trim());

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      cache: 'no-store',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
      },
      body: params.toString(),
    });

    // HTTP 상태 코드가 200번대가 아닐 경우 검로드의 실제 에러 원문 강제 로깅
    if (!gumroadResponse.ok) {
      const errorText = await gumroadResponse.text();
      console.error(`검로드 서버 통신 에러 (${gumroadResponse.status}):`, errorText);
      return NextResponse.json({ success: false, message: `검로드 통신 오류: ${gumroadResponse.status}` }, { status: 400 });
    }

    const gumroadData = await gumroadResponse.json();

    if (!gumroadData.success) {
      console.error('검로드 인증 실패:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

    // 2. Supabase 데이터베이스 저장
    const supabase = getSupabase();
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) {
      console.error('DB 저장 실패:', error);
      return NextResponse.json({ success: false, message: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API 서버 오류:', err);
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}