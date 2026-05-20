import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경 변수 검증 및 안전한 클라이언트 생성
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
    // 검로드 규격에 맞춰 permalink와 license_key를 명확히 전달합니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: 'gait69',
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

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