import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = 'sb_publishable_Vc7uQZU9tF9qqnMePemOrA_f_siAK6D';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 검로드 고유 상품 주소 슬러그
const GUMROAD_PRODUCT_PERMALINK = 'gait69';

// 🚨 [H님 필독] 현재 운영 중이신 개발자 전용 마스터 시리얼 키를 여기에 정확히 기입하십시오.
// 여러 개라면 배열 형태로 ['KEY1', 'KEY2'] 구조로 확장 가능합니다.
const MASTER_SERIAL_KEYS = ['MASTER-DEVEL-OPER-H004'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, userId } = body;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터(시리얼 키, 유저 ID)가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const trimmedKey = licenseKey.trim();

    // -------------------------------------------------------------
    // [1단계] 마스터 시리얼 키 프리패스 통제 (기존 시스템 수호)
    // -------------------------------------------------------------
    if (MASTER_SERIAL_KEYS.includes(trimmedKey)) {
      // 마스터키 유저는 Supabase에 별도 적재 이력이 없더라도 즉시 프리패스 승인 처리
      return NextResponse.json({
        success: true,
        isMaster: true,
        message: '마스터 개발자 권한으로 인증이 즉시 승인되었습니다.',
      });
    }

    // -------------------------------------------------------------
    // [2단계] Gumroad 공식 라이선스 검증 API 동시 요청
    // -------------------------------------------------------------
    const gumroadResponse = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_permalink: GUMROAD_PRODUCT_PERMALINK,
        license_key: trimmedKey,
        increment_uses_count: 'true',
      }),
    });

    const gumroadData = await gumroadResponse.json();

    // 검로드 서버 인증 실패 시 예외 처리
    if (!gumroadResponse.ok || !gumroadData.success) {
      return NextResponse.json(
        { success: false, message: '유효하지 않거나 존재하지 않는 시리얼 번호입니다.' },
        { status: 400 }
      );
    }

    // 환불 및 분쟁 상태 불법 라이선스 필터링
    if (gumroadData.purchase.refunded || gumroadData.purchase.disputed || gumroadData.purchase.chargebacked) {
      return NextResponse.json(
        { success: false, message: '취소, 환불 또는 분쟁 처리된 결제건의 키입니다.' },
        { status: 403 }
      );
    }

    // -------------------------------------------------------------
    // [3단계] Supabase 데이터베이스 중복 등록 원천 봉쇄
    // -------------------------------------------------------------
    const { data: existingLicense, error: searchError } = await supabase
      .from('users_license')
      .select('user_id')
      .eq('license_key', trimmedKey)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      return NextResponse.json(
        { success: false, message: '데이터베이스 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (existingLicense) {
      if (existingLicense.user_id !== userId) {
        return NextResponse.json(
          { success: false, message: '이 시리얼 번호는 이미 다른 계정에 연결되어 사용 중입니다.' },
          { status: 409 }
        );
      } else {
        return NextResponse.json({
          success: true,
          message: '이미 이 계정에 등록되어 활성화된 라이선스입니다.',
        });
      }
    }

    // -------------------------------------------------------------
    // [4단계] 신규 검로드 유저 Supabase 최종 영구 적재
    // -------------------------------------------------------------
    const { error: insertError } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: trimmedKey,
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, message: '라이선스 내역을 Supabase에 저장하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isMaster: false,
      message: '시리얼 번호 인증이 성공적으로 완료되었습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '서버 내부 연동 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}