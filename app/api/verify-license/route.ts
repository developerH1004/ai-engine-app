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

    const supabase = getSupabase();
    const trimmedKey = licenseKey.trim();

    // 1. Supabase 데이터베이스 선행 조회 (수동 등록 우회 처리)
    // 현재 접속한 유저 ID와 입력한 라이선스 키가 일치하며 승인된 상태인지 확인합니다.
    const { data: existingLicense, error: searchError } = await supabase
      .from('users_license')
      .select('*')
      .eq('license_key', trimmedKey)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    // DB에 유효한 라이선스가 이미 존재하면 검로드 통신을 생략하고 즉시 승인 반환
    if (existingLicense) {
      return NextResponse.json({ success: true, message: 'DB 인증 완료 (수동 등록)' });
    }

    // 2. DB에 없다면 기존대로 검로드 API 검증 시도
    const params = new URLSearchParams();
    params.append('product_permalink', 'gait69');
    params.append('license_key', trimmedKey);

    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      cache: 'no-store',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
      },
      body: params.toString(),
    });

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

    // 3. 검로드 인증 성공 시 DB 저장 (현재는 검로드 서버 장애로 도달하지 못하는 영역)
    const { error: insertError } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: trimmedKey,
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (insertError) {
      console.error('DB 저장 실패:', insertError);
      return NextResponse.json({ success: false, message: 'DB 저장 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API 서버 오류:', err);
    return NextResponse.json({ success: false, message: '서버 내부 오류' }, { status: 500 });
  }
}