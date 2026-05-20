import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 검로드 상품의 공식 슬러그
const GUMROAD_PERMALINK = 'gait69'; 

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    if (!licenseKey || !userId) {
      return NextResponse.json({ success: false, message: '파라미터 누락' }, { status: 400 });
    }

    // 1. 검로드 API 규격 준수: product_permalink와 license_key는 필수입니다.
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      body: new URLSearchParams({
        product_permalink: GUMROAD_PERMALINK,
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 2. 검증 결과 처리
    // 검로드 API는 success가 false인 경우 인증을 거부한 것입니다.
    if (!gumroadData.success) {
      console.error('검로드 인증 거부:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

    // 3. Supabase 데이터베이스 저장
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('서버 내부 오류:', err);
    return NextResponse.json({ success: false, message: '서버 오류' }, { status: 500 });
  }
}