import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 에러 메시지에서 요구한 product_id 값으로 변경
const PRODUCT_ID = 'R5QUpC0u9kq5Ax6QjG9Pg=='; 

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();

    if (!licenseKey || !userId) {
      return NextResponse.json({ success: false, message: '키 또는 ID가 없습니다.' }, { status: 400 });
    }
    
    // 검로드 API 호출: product_permalink 대신 에러에서 요구한 product_id 사용
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_id: PRODUCT_ID,
        license_key: licenseKey.trim(),
        increment_uses_count: 'true',
      }).toString(),
    });

    const gumroadData = await gumroadResponse.json();

    if (!gumroadResponse.ok || !gumroadData.success) {
      console.error('Gumroad API Error:', gumroadData);
      return NextResponse.json({ success: false, message: '인증 실패' }, { status: 400 });
    }

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
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}