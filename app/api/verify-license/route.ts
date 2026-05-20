import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    // 1. 검로드 API 검증
    // 핵심: permalink를 동적으로 처리하는 대신, 검로드가 가장 선호하는 
    // license_key 단독 검증 방식을 사용하되, 헤더 구성을 표준화했습니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json' 
      },
      body: new URLSearchParams({
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 2. 결과 검증
    // 검로드는 success: true 일 때만 정상 인증입니다.
    if (!gumroadData.success) {
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

    // 3. Supabase 등록
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