import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    // 검로드 API: 라이선스 키와 함께 반드시 permalink를 전달해야 합니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: 'gait69', // 이곳에 상품 슬러그를 명시합니다.
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 인증 실패 시 상세 로그 확인
    if (!gumroadData.success) {
      console.error('검로드 인증 실패:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

    // Supabase 데이터베이스 등록
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('서버 오류:', err);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}