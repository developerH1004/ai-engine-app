import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    // 핵심: URLSearchParams를 쓰지 않고 객체로 전달하여 전송 규격을 단순화했습니다.
    // 또한, 500 에러를 유발하는 product_permalink 파라미터를 완전히 제거하고
    // 오직 라이선스 키만으로 검증하는 '최소 요청'을 시도합니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: `license_key=${licenseKey.trim()}&increment_uses_count=true`
    });

    const gumroadData = await gumroadResponse.json();

    if (!gumroadData.success) {
      console.error('검로드 최종 인증 실패:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

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
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}