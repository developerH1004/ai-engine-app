import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const GUMROAD_PRODUCT_PERMALINK = 'gait69';
const MASTER_SERIAL_KEYS = ['MASTER-DEVEL-OPER-H004'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { licenseKey, userId } = body;

    if (!licenseKey || !userId) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    const trimmedKey = licenseKey.trim();

    // [1단계] 마스터 개발자 키 프리패스
    if (MASTER_SERIAL_KEYS.includes(trimmedKey)) {
      return NextResponse.json({
        success: true,
        isMaster: true,
        message: '마스터 개발자 권한으로 인증이 즉시 승인되었습니다.',
      });
    }

    // [2단계] Supabase 데이터베이스 우선 조회 (듀얼 시스템의 핵심)
    // 데이터베이스에 키가 먼저 존재하는지 확인하여 자체 생산 키와 기존 등록 키를 판별합니다.
    const { data: existingLicense, error: searchError } = await supabase
      .from('users_license')
      .select('*')
      .eq('license_key', trimmedKey)
      .maybeSingle();

    if (searchError) {
      return NextResponse.json(
        { success: false, message: '데이터베이스 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 데이터베이스에 이미 등록된 키인 경우 (자체 생산 선등록 키 또는 기활성화된 검로드 키)
    if (existingLicense) {
      // 1. 이미 다른 유저가 소유하고 있는 경우 차단
      if (existingLicense.user_id && existingLicense.user_id !== 'anonymous-user' && existingLicense.user_id !== userId) {
        return NextResponse.json(
          { success: false, message: '이 시리얼 번호는 이미 다른 계정에 연결되어 사용 중입니다.' },
          { status: 409 }
        );
      }
      
      // 2. 자체 생산 키가 미활성 상태이거나 소유자 연결이 필요한 경우 업데이트 후 활성화
      if (!existingLicense.is_active || existingLicense.user_id !== userId) {
        const { error: updateError } = await supabase
          .from('users_license')
          .update({ user_id: userId, is_active: true })
          .eq('license_key', trimmedKey);

        if (updateError) {
          return NextResponse.json(
            { success: false, message: '자체 라이선스 활성화 처리 중 오류가 발생했습니다.' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        isMaster: false,
        message: '라이선스 인증이 성공적으로 완료되었습니다.',
      });
    }

    // [3단계] 데이터베이스에 없는 새로운 키일 경우에만 검로드 API로 최종 검증
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

    if (!gumroadResponse.ok || !gumroadData.success) {
      return NextResponse.json(
        { success: false, message: '유효하지 않거나 존재하지 않는 시리얼 번호입니다.' },
        { status: 400 }
      );
    }

    if (gumroadData.purchase.refunded || gumroadData.purchase.disputed || gumroadData.purchase.chargebacked) {
      return NextResponse.json(
        { success: false, message: '취소, 환불 또는 분쟁 처리된 결제건의 키입니다.' },
        { status: 403 }
      );
    }

    // [4단계] 신규 검로드 키 검증 통과 후 Supabase에 결제 정보와 함께 최종 영구 적재
    const { error: insertError } = await supabase.from('users_license').insert({
      user_id: userId,
      license_key: trimmedKey,
      buyer_email: gumroadData.purchase.email,
      is_active: true,
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, message: '라이선스 내역을 저장하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      isMaster: false,
      message: '검로드 라이선스 인증 및 등록이 성공적으로 완료되었습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '서버 내부 연동 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
}