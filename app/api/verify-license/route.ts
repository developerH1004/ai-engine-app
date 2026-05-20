import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // 환경 변수에서만 불러옴
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GUMROAD_PRODUCT_PERMALINK = '여기에_검로드_상품_실제_슬러그_입력'; 

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, userId } = await req.json();
    
    // 1. 검로드 API 호출 (application/x-www-form-urlencoded 필수)
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

    if (!gumroadData.success) {
      return NextResponse.json({ success: false, message: '검로드 인증 실패' }, { status: 400 });
    }

    // 2. Supabase 저장 (Service Role Key가 올바르면 성공함)
    const { error } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: licenseKey.trim(),
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}