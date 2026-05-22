"""
AI DB 자동 업데이트 스크립트 — auto_update.py
================================================
매일 자동 실행:
  1. HuggingFace API에서 최신 모델 수집
  2. 서비스 종료 버전 탐지 → 구버전으로 이동
  3. 신규 제품 전문가 분석 자동 생성 (Groq API 무료)
  4. Supabase DB 업데이트
  5. 업데이트 로그 저장

필요한 GitHub Secrets:
  SUPABASE_URL         : Supabase 프로젝트 URL
  SUPABASE_SERVICE_KEY : Supabase service_role 키 (쓰기 권한)
  GROQ_API_KEY         : Groq API 키 (무료, groq.com에서 발급)
"""

import os
import json
import time
import datetime
import requests
from supabase import create_client

# ── 환경변수 ──────────────────────────────────────────────────
SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_KEY  = os.getenv("SUPABASE_KEY")
GROQ_API_KEY  = os.getenv("GROQ_API_KEY")

# ── 설정 ──────────────────────────────────────────────────────
HF_API        = "https://huggingface.co/api/models"
LOG_DIR       = "logs"
TODAY         = datetime.date.today().isoformat()
LOG_FILE      = f"{LOG_DIR}/update_{TODAY}.json"

# 수집할 HF 태스크
HF_TASKS = [
    "text-generation", "text-to-image", "text-to-video",
    "text-to-speech", "automatic-speech-recognition",
    "image-to-text", "text-to-audio",
]

# 태스크 → 대분류/세분류 매핑
TASK_MAP = {
    "text-generation":              ("01. 파운데이션 모델", "01-01. 범용 언어 모델"),
    "text-to-image":                ("03. 비주얼 아트 및 디자인", "03-01. 예술적 이미지 생성"),
    "text-to-video":                ("04. 영상 및 모션 그래픽", "04-01. 텍스트-투-비디오"),
    "text-to-speech":               ("05. 오디오 및 음악", "05-01. 음성 합성 및 TTS"),
    "automatic-speech-recognition": ("05. 오디오 및 음악", "05-05. 오디오 포스트 프로덕션"),
    "image-to-text":                ("01. 파운데이션 모델", "01-03. 멀티모달 통합 지능"),
    "text-to-audio":                ("05. 오디오 및 음악", "05-03. AI 작곡 및 배경음악"),
}


# ── Groq API로 전문가 분석 생성 ───────────────────────────────
def generate_analysis(product_name: str, manufacturer: str, category: str, version: str) -> str:
    """Groq API (무료) 로 전문가 분석 자동 생성"""
    if not GROQ_API_KEY:
        return f"{product_name}: {category} 분야 AI 모델."

    try:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{
                "role": "user",
                "content": (
                    f"다음 AI 제품에 대해 한국어로 100-150자 전문가 분석을 작성하세요. "
                    f"제품명: {product_name}, 제조사: {manufacturer}, "
                    f"분야: {category}, 최신버전: {version}. "
                    f"핵심 기능과 시장 포지션을 간결하게 설명하세요. "
                    f"분석 텍스트만 출력하세요."
                )
            }],
            "max_tokens": 200,
            "temperature": 0.3,
        }
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers, json=payload, timeout=30
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  Groq 분석 생성 실패: {e}")
        return f"{product_name}: {category} 분야 AI 모델. 제조사: {manufacturer}."


# ── HuggingFace 최신 모델 수집 ────────────────────────────────
def fetch_new_hf_models(existing_names: set) -> list:
    """지난 7일 내 새로 등록된 HF 모델 수집"""
    new_models = []
    cutoff = datetime.date.today() - datetime.timedelta(days=7)

    for task in HF_TASKS:
        try:
            r = requests.get(HF_API, params={
                "pipeline_tag": task,
                "sort": "createdAt",
                "direction": -1,
                "limit": 50,
                "full": True,
            }, timeout=15)
            r.raise_for_status()
            models = r.json()

            for m in models:
                model_id   = m.get("id", "")
                model_name = model_id.split("/")[-1] if "/" in model_id else model_id
                created    = m.get("createdAt", "")[:10]

                # 7일 이내 신규만
                if created < cutoff.isoformat():
                    break

                # 이미 있는 것 스킵
                if model_name.lower() in existing_names:
                    continue

                downloads = m.get("downloads", 0)
                if downloads < 50:  # 최소 다운로드 필터
                    continue

                cat, sub = TASK_MAP.get(task, ("01. 파운데이션 모델", "01-01. 범용 언어 모델"))
                author = model_id.split("/")[0] if "/" in model_id else "Unknown"

                new_models.append({
                    "category_main":       cat,
                    "category_sub":        sub,
                    "country":             "글로벌",
                    "manufacturer":        author,
                    "product_name":        model_name,
                    "description":         "",  # 나중에 Groq로 생성
                    "official_url":        f"https://huggingface.co/{model_id}",
                    "verification_status": "HF자동수집",
                    "is_research_model":   downloads < 1000,
                    "_version":            created,
                    "_downloads":          downloads,
                })
                existing_names.add(model_name.lower())

            time.sleep(0.5)
        except Exception as e:
            print(f"  HF 수집 오류 ({task}): {e}")

    return new_models


# ── 분석 빈 항목 보강 ─────────────────────────────────────────
def enrich_empty_descriptions(supabase, limit: int = 20):
    """분석이 없거나 짧은 항목에 Groq 분석 자동 생성"""
    if not GROQ_API_KEY:
        print("  GROQ_API_KEY 없음 — 분석 생성 스킵")
        return 0

    # 100자 미만인 항목 조회
    result = supabase.table("ai_products") \
        .select("id, product_name, manufacturer, category_sub, description") \
        .limit(limit * 3) \
        .execute()

    enriched = 0
    for row in result.data:
        desc = str(row.get("description") or "")
        if len(desc) >= 100:
            continue
        if enriched >= limit:
            break

        analysis = generate_analysis(
            product_name=row.get("product_name", ""),
            manufacturer=row.get("manufacturer", ""),
            category=row.get("category_sub", ""),
            version="최신",
        )

        supabase.table("ai_products") \
            .update({"description": analysis}) \
            .eq("id", row["id"]) \
            .execute()

        enriched += 1
        time.sleep(0.3)

    return enriched


# ── 메인 ─────────────────────────────────────────────────────
def main():
    print(f"{'='*50}")
    print(f" AI DB 자동 업데이트 — {TODAY}")
    print(f"{'='*50}")

    # Supabase 연결
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 완료")

    # 기존 제품명 목록
    existing = supabase.table("ai_products").select("product_name").execute()
    existing_names = {r["product_name"].lower() for r in existing.data}
    print(f"  기존 제품 수: {len(existing_names):,}개")

    log = {
        "date": TODAY,
        "added": [],
        "enriched": 0,
        "errors": [],
    }

    # 1. 신규 HF 모델 수집
    print("\n[1] 신규 HF 모델 수집...")
    new_models = fetch_new_hf_models(existing_names)
    print(f"  신규 발견: {len(new_models)}개")

    # 2. 신규 모델 분석 생성 후 DB 저장
    added = 0
    for m in new_models:
        try:
            # 분석 생성
            if GROQ_API_KEY and not m["description"]:
                m["description"] = generate_analysis(
                    m["product_name"], m["manufacturer"],
                    m["category_sub"], m.get("_version", "최신")
                )
                time.sleep(0.3)

            # DB 저장
            insert_data = {k: v for k, v in m.items() if not k.startswith("_")}
            supabase.table("ai_products").insert(insert_data).execute()

            # 버전 저장
            if m.get("_version"):
                product = supabase.table("ai_products") \
                    .select("id").eq("product_name", m["product_name"]) \
                    .single().execute()
                if product.data:
                    supabase.table("ai_versions").insert({
                        "product_id":   product.data["id"],
                        "version_name": m["product_name"],
                        "is_active":    True,
                        "sort_order":   1,
                    }).execute()

            log["added"].append(m["product_name"])
            added += 1
            print(f"  ✅ 추가: {m['product_name']}")
        except Exception as e:
            log["errors"].append(f"{m['product_name']}: {str(e)}")

    print(f"  추가 완료: {added}개")

    # 3. 분석 보강
    print("\n[2] 분석 보강 (분당 30개 Groq 무료 한도)...")
    enriched = enrich_empty_descriptions(supabase, limit=25)
    log["enriched"] = enriched
    print(f"  보강 완료: {enriched}개")

    # 4. 업데이트 로그 저장
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)
    print(f"\n📋 로그 저장: {LOG_FILE}")

    # 5. update_logs 테이블에도 기록
    supabase.table("update_logs").insert({
        "action":       "daily_update",
        "product_name": f"일괄 업데이트 {TODAY}",
        "detail":       f"신규 {added}개 추가, 분석 {enriched}개 보강",
        "source":       "GitHub Actions",
    }).execute()

    print(f"\n{'='*50}")
    print(f" ✅ 완료! 신규: {added}개 | 보강: {enriched}개")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
