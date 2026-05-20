import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 슬러그 확인: Gumroad 주소의 gait69 가 맞다면 그대로 유지
const GUMROAD_PRODUCT_PERMALINK = 'gait69'; 

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    // 검로드 API 검증
    // 핵심 변경: 요청 바디를 보다 명시적으로 구성
    const params = new URLSearchParams();
    params.append('product_permalink', GUMROAD_PRODUCT_PERMALINK);
    params.append('license_key', licenseKey.trim());
    params.append('increment_uses_count', 'true');

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const gumroadData = await gumroadResponse.json();

    // 400/500 에러 시 실제 검로드의 에러 메시지를 로그로 찍음
    if (!gumroadResponse.ok || !gumroadData.success) {
      console.error('Gumroad API Full Response:', JSON.stringify(gumroadData));
      return NextResponse.json({ 
        success: false, 
        message: gumroadData.message || '인증 실패' 
      }, { status: gumroadResponse.status });
    }

    // 데이터베이스 저장
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ success: false, message: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Internal Error:', err);
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}