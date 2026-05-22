"""
AI DB 자동 업데이트 스크립트 — auto_update.py
================================================
매일 자동 실행:
  1. HuggingFace API에서 최신 모델 수집
  2. product_name 기준 중복 체크
  3. 영문 데이터 먼저 저장 → 한글 자동 번역
  4. 신규 제품 추가 시 glossary 용어 자동 생성
  5. glossary 한글 미번역 항목 보강
  6. Supabase DB 업데이트
  7. 업데이트 로그 저장

필요한 GitHub Secrets:
  SUPABASE_URL  : Supabase 프로젝트 URL
  SUPABASE_KEY  : Supabase service_role 키
  GROQ_API_KEY  : Groq API 키 (무료)
"""

import os, json, time, datetime, requests, uuid
from supabase import create_client

# ── 환경변수 ──────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ── 설정 ──────────────────────────────────────────────────────
HF_API   = "https://huggingface.co/api/models"
LOG_DIR  = "logs"
TODAY    = datetime.date.today().isoformat()
LOG_FILE = f"{LOG_DIR}/update_{TODAY}.json"

HF_TASKS = [
    "text-generation", "text-to-image", "text-to-video",
    "text-to-speech", "automatic-speech-recognition",
    "image-to-text", "text-to-audio",
]

TASK_MAP = {
    "text-generation":              {
        "category_main": "01. Foundation Models",
        "category_sub":  "01-01. General Purpose Language Models",
        "category_main_ko": "01. 파운데이션 모델",
        "category_sub_ko":  "01-01. 범용 언어 모델",
        "modality": "Text", "modality_ko": "텍스트",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "01-01",
    },
    "text-to-image":                {
        "category_main": "03. Visual Arts & Design",
        "category_sub":  "03-01. Artistic Image Generation",
        "category_main_ko": "03. 비주얼 아트 및 디자인",
        "category_sub_ko":  "03-01. 예술적 이미지 생성",
        "modality": "Image", "modality_ko": "이미지",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "03-01",
    },
    "text-to-video":                {
        "category_main": "04. Video & Motion Graphics",
        "category_sub":  "04-01. Text-to-Video",
        "category_main_ko": "04. 영상 및 모션 그래픽",
        "category_sub_ko":  "04-01. 텍스트-투-비디오",
        "modality": "Video", "modality_ko": "영상",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "04-01",
    },
    "text-to-speech":               {
        "category_main": "05. Audio & Music",
        "category_sub":  "05-01. Voice Synthesis & TTS",
        "category_main_ko": "05. 오디오 및 음악",
        "category_sub_ko":  "05-01. 음성 합성 및 TTS",
        "modality": "Audio", "modality_ko": "오디오",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "05-01",
    },
    "automatic-speech-recognition": {
        "category_main": "05. Audio & Music",
        "category_sub":  "05-05. Audio Post-Production",
        "category_main_ko": "05. 오디오 및 음악",
        "category_sub_ko":  "05-05. 오디오 포스트 프로덕션",
        "modality": "Audio", "modality_ko": "오디오",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "05-05",
    },
    "image-to-text":                {
        "category_main": "01. Foundation Models",
        "category_sub":  "01-03. Multimodal Integrated Intelligence",
        "category_main_ko": "01. 파운데이션 모델",
        "category_sub_ko":  "01-03. 멀티모달 통합 지능",
        "modality": "Multimodal", "modality_ko": "멀티모달",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "01-03",
    },
    "text-to-audio":                {
        "category_main": "05. Audio & Music",
        "category_sub":  "05-03. AI Composition & Background Music",
        "category_main_ko": "05. 오디오 및 음악",
        "category_sub_ko":  "05-03. AI 작곡 및 배경음악",
        "modality": "Audio", "modality_ko": "오디오",
        "service_type": "API / Cloud", "service_type_ko": "API / 클라우드",
        "subcategory_code": "05-03",
    },
}


# ══ Groq API 헬퍼 ════════════════════════════════════════════

def groq_call(prompt: str, max_tokens=300) -> str:
    if not GROQ_API_KEY:
        return ""
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {GROQ_API_KEY}",
                     "Content-Type": "application/json"},
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.3,
            }, timeout=30
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  Groq 오류: {e}")
        return ""


def gen_desc_en(product_name, manufacturer, category, version):
    return groq_call(
        f"Write an 80-120 word expert analysis in English for this AI product. "
        f"Name: {product_name}, Maker: {manufacturer}, "
        f"Category: {category}, Version: {version}. "
        f"Focus on key features and market position. Output analysis text only.",
        max_tokens=200
    ) or f"{product_name} by {manufacturer}. {category} AI model."


def gen_desc_ko(en_text, product_name):
    if not en_text:
        return ""
    return groq_call(
        f"다음 영문 AI 제품 설명을 자연스러운 한국어로 번역하세요. "
        f"번역문만 출력하세요:\n\n{en_text}",
        max_tokens=300
    )


def gen_glossary_term(product_name, manufacturer, category, subcategory_code):
    """신규 제품에 대한 glossary 용어 영문/한글 생성"""
    en = groq_call(
        f"Define the AI term '{product_name}' by {manufacturer} in {category} "
        f"in 30-50 words. Focus on what it is and its key capability. "
        f"Output definition text only.",
        max_tokens=100
    ) or f"{product_name}: An AI model by {manufacturer} in the {category} category."

    time.sleep(0.3)

    ko = groq_call(
        f"다음 AI 용어 정의를 자연스러운 한국어로 번역하세요. "
        f"번역문만 출력하세요:\n\n{en}",
        max_tokens=150
    )

    return en, ko


# ══ HuggingFace 수집 ══════════════════════════════════════════

def fetch_new_hf_models(existing_names: set) -> list:
    new_models = []
    cutoff = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()

    for task in HF_TASKS:
        try:
            r = requests.get(HF_API, params={
                "pipeline_tag": task, "sort": "createdAt",
                "direction": -1, "limit": 50, "full": True,
            }, timeout=15)
            r.raise_for_status()

            for m in r.json():
                model_id   = m.get("id", "")
                model_name = model_id.split("/")[-1] if "/" in model_id else model_id
                created    = m.get("createdAt", "")[:10]

                if created < cutoff: break
                if model_name.lower() in existing_names: continue
                if m.get("downloads", 0) < 50: continue

                cat    = TASK_MAP.get(task, TASK_MAP["text-generation"])
                author = model_id.split("/")[0] if "/" in model_id else "Unknown"

                new_models.append({
                    **{k: v for k, v in cat.items() if k != "subcategory_code"},
                    "country":             "Global",
                    "manufacturer":        author,
                    "product_name":        model_name,
                    "official_url":        f"https://huggingface.co/{model_id}",
                    "verification_status": "Auto-collected (HF)",
                    "pricing_type":        "Free",
                    "pricing_type_ko":     "무료",
                    "service_region":      "Global",
                    "service_region_ko":   "글로벌",
                    "is_research_model":   m.get("downloads", 0) < 1000,
                    "parent_platform":     "HuggingFace",
                    "_created":            created,
                    "_downloads":          m.get("downloads", 0),
                    "_subcategory_code":   cat.get("subcategory_code", "01-01"),
                })
                existing_names.add(model_name.lower())

            time.sleep(0.5)
        except Exception as e:
            print(f"  HF 수집 오류 ({task}): {e}")

    return new_models


# ══ glossary 자동 생성 ════════════════════════════════════════

def add_glossary_term(supabase, product_name, manufacturer,
                      category_sub, subcategory_code):
    """신규 제품에 대한 glossary 용어 추가 (중복 체크 포함)"""
    try:
        # 이미 있으면 스킵
        exists = supabase.table("glossary") \
            .select("term_id") \
            .ilike("term_en", product_name) \
            .execute()
        if exists.data:
            return False

        def_en, def_ko = gen_glossary_term(
            product_name, manufacturer, category_sub, subcategory_code
        )

        supabase.table("glossary").insert({
            "term_id":         str(uuid.uuid4()),
            "subcategory_code": subcategory_code,
            "term_en":         product_name,
            "term_kr":         product_name,   # 영문명 그대로 (고유명사)
            "definition_en":   def_en,
            "definition_kr":   def_ko,
        }).execute()
        return True
    except Exception as e:
        print(f"  glossary 추가 오류 ({product_name}): {e}")
        return False


def enrich_glossary_korean(supabase, limit=15):
    """glossary 한글 정의 미번역 항목 보강"""
    if not GROQ_API_KEY:
        return 0

    result = supabase.table("glossary") \
        .select("term_id, term_en, definition_en, definition_kr") \
        .is_("definition_kr", "null") \
        .limit(limit) \
        .execute()

    enriched = 0
    for row in result.data:
        en = row.get("definition_en", "")
        if not en:
            continue

        ko = groq_call(
            f"다음 AI 용어 정의를 자연스러운 한국어로 번역하세요. "
            f"번역문만 출력하세요:\n\n{en}",
            max_tokens=200
        )
        if ko:
            supabase.table("glossary") \
                .update({"definition_kr": ko}) \
                .eq("term_id", row["term_id"]) \
                .execute()
            enriched += 1
            time.sleep(0.3)

    return enriched


# ══ ai_products 한글 보강 ════════════════════════════════════

def enrich_products_korean(supabase, limit=20):
    """description_ko 없는 기존 항목 한글 번역 보강"""
    if not GROQ_API_KEY:
        return 0

    result = supabase.table("ai_products") \
        .select("id, product_name, description, description_ko") \
        .is_("description_ko", "null") \
        .not_.is_("description", "null") \
        .limit(limit) \
        .execute()

    enriched = 0
    for row in result.data:
        en = row.get("description", "")
        if not en:
            continue
        ko = gen_desc_ko(en, row["product_name"])
        if ko:
            supabase.table("ai_products") \
                .update({"description_ko": ko}) \
                .eq("id", row["id"]) \
                .execute()
            enriched += 1
            time.sleep(0.3)

    return enriched


# ══ 메인 ═════════════════════════════════════════════════════

def main():
    print(f"{'='*50}")
    print(f" AI DB 자동 업데이트 — {TODAY}")
    print(f"{'='*50}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_KEY 환경변수 없음")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 완료")

    existing = supabase.table("ai_products").select("product_name").execute()
    existing_names = {r["product_name"].lower() for r in existing.data}
    print(f"  기존 제품 수: {len(existing_names):,}개")

    log = {
        "date": TODAY,
        "products_added": [],
        "glossary_added": [],
        "products_ko_enriched": 0,
        "glossary_ko_enriched": 0,
        "errors": [],
    }

    # ── 1. 신규 HF 모델 수집 ──────────────────────────────────
    print("\n[1] 신규 HF 모델 수집...")
    new_models = fetch_new_hf_models(existing_names)
    print(f"  신규 발견: {len(new_models)}개")

    # ── 2. 영문 설명 생성 → 한글 번역 → DB 저장 ──────────────
    added = 0
    for m in new_models:
        try:
            desc_en = gen_desc_en(
                m["product_name"], m["manufacturer"],
                m["category_sub"], m.get("_created", "최신")
            )
            time.sleep(0.3)
            desc_ko = gen_desc_ko(desc_en, m["product_name"])
            time.sleep(0.3)

            insert_data = {k: v for k, v in m.items()
                          if not k.startswith("_")}
            insert_data["description"]    = desc_en
            insert_data["description_ko"] = desc_ko

            supabase.table("ai_products").insert(insert_data).execute()

            # ── 3. glossary 용어 자동 생성 ────────────────────
            g_added = add_glossary_term(
                supabase,
                m["product_name"],
                m["manufacturer"],
                m["category_sub"],
                m["_subcategory_code"],
            )
            if g_added:
                log["glossary_added"].append(m["product_name"])
                print(f"  📚 glossary 추가: {m['product_name']}")

            log["products_added"].append(m["product_name"])
            added += 1
            print(f"  ✅ 제품 추가: {m['product_name']}")

        except Exception as e:
            err = f"{m['product_name']}: {str(e)}"
            log["errors"].append(err)
            print(f"  ❌ {err}")

    print(f"  제품 추가 완료: {added}개")

    # ── 4. 기존 제품 한글 보강 ────────────────────────────────
    print("\n[2] 기존 제품 한글 보강...")
    p_enriched = enrich_products_korean(supabase, limit=20)
    log["products_ko_enriched"] = p_enriched
    print(f"  완료: {p_enriched}개")

    # ── 5. glossary 한글 보강 ─────────────────────────────────
    print("\n[3] glossary 한글 보강...")
    g_enriched = enrich_glossary_korean(supabase, limit=15)
    log["glossary_ko_enriched"] = g_enriched
    print(f"  완료: {g_enriched}개")

    # ── 6. 로그 저장 ──────────────────────────────────────────
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)

    try:
        supabase.table("update_logs").insert({
            "action":       "daily_update",
            "product_name": f"일괄 업데이트 {TODAY}",
            "detail":       (
                f"제품 {added}개 추가 | "
                f"glossary {len(log['glossary_added'])}개 추가 | "
                f"제품 한글 {p_enriched}개 보강 | "
                f"glossary 한글 {g_enriched}개 보강"
            ),
            "source": "GitHub Actions",
        }).execute()
    except: pass

    print(f"\n{'='*50}")
    print(f" ✅ 완료!")
    print(f"    제품:     신규 {added}개 | 한글보강 {p_enriched}개")
    print(f"    glossary: 신규 {len(log['glossary_added'])}개 | 한글보강 {g_enriched}개")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
