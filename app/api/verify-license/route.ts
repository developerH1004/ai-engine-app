import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    // 검로드 API: 이번에는 판매자 토큰 없이 순수 라이선스 키만 던지는 방식입니다.
    // 만약 여기서 500이 난다면 검로드 측에서 해당 라이선스 키를 식별하지 못하는 것입니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0' // 검로드의 봇 차단 방지
      },
      body: new URLSearchParams({
        product_permalink: 'gait69',
        license_key: licenseKey.trim(),
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 결과 확인
    if (!gumroadData.success) {
      console.error('Gumroad 응답 상세:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 거부' }, { status: 400 });
    }

    // Supabase 저장
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}