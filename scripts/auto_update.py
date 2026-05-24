"""
AI DB 자동 업데이트 스크립트 — auto_update.py v5
================================================
수정사항:
  - DB 조회 페이지네이션 추가 (999개 한도 해결)
  - Groq 모델 → llama-3.3-70b-versatile (최신 정보)
  - 버전 딕셔너리 하드코딩 병행 (감지 실패 대비)
"""

import os, json, time, datetime, requests, uuid, re
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

HF_API   = "https://huggingface.co/api/models"
LOG_DIR  = "logs"
TODAY    = datetime.date.today().isoformat()
LOG_FILE = f"{LOG_DIR}/update_{TODAY}.json"

HF_TASKS = [
    "text-generation","text-to-image","text-to-video",
    "text-to-speech","automatic-speech-recognition",
    "image-to-text","text-to-audio",
]

TASK_MAP = {
    "text-generation":              {"category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","category_main_ko":"01. 파운데이션 모델","category_sub_ko":"01-01. 범용 언어 모델","modality":"Text","modality_ko":"텍스트","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"01-01"},
    "text-to-image":                {"category_main":"03. Visual Arts & Design","category_sub":"03-01. Artistic Image Generation","category_main_ko":"03. 비주얼 아트 및 디자인","category_sub_ko":"03-01. 예술적 이미지 생성","modality":"Image","modality_ko":"이미지","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"03-01"},
    "text-to-video":                {"category_main":"04. Video & Motion Graphics","category_sub":"04-01. Text-to-Video","category_main_ko":"04. 영상 및 모션 그래픽","category_sub_ko":"04-01. 텍스트-투-비디오","modality":"Video","modality_ko":"영상","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"04-01"},
    "text-to-speech":               {"category_main":"05. Audio & Music","category_sub":"05-01. Voice Synthesis & TTS","category_main_ko":"05. 오디오 및 음악","category_sub_ko":"05-01. 음성 합성 및 TTS","modality":"Audio","modality_ko":"오디오","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"05-01"},
    "automatic-speech-recognition": {"category_main":"05. Audio & Music","category_sub":"05-05. Audio Post-Production","category_main_ko":"05. 오디오 및 음악","category_sub_ko":"05-05. 오디오 포스트 프로덕션","modality":"Audio","modality_ko":"오디오","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"05-05"},
    "image-to-text":                {"category_main":"01. Foundation Models","category_sub":"01-03. Multimodal Integrated Intelligence","category_main_ko":"01. 파운데이션 모델","category_sub_ko":"01-03. 멀티모달 통합 지능","modality":"Multimodal","modality_ko":"멀티모달","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"01-03"},
    "text-to-audio":                {"category_main":"05. Audio & Music","category_sub":"05-03. AI Composition & Background Music","category_main_ko":"05. 오디오 및 음악","category_sub_ko":"05-03. AI 작곡 및 배경음악","modality":"Audio","modality_ko":"오디오","service_type":"API / Cloud","service_type_ko":"API / 클라우드","subcategory_code":"05-03"},
}

# ── 주요 12개 모델 + 하드코딩 버전 (감지 실패 대비) ────────────
MAJOR_MODELS = {
    "ChatGPT Plus":       {"manufacturer":"OpenAI",        "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"GPT-4o (2026)"},
    "Gemini Advanced":    {"manufacturer":"Google",        "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"Gemini 2.5 Pro"},
    "Copilot Pro":        {"manufacturer":"Microsoft",     "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"GPT-4o (2026)"},
    "Claude Pro":         {"manufacturer":"Anthropic",     "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"Claude Sonnet 4.6"},
    "Perplexity Pro":     {"manufacturer":"Perplexity AI", "category_main":"02. Search & Knowledge Discovery","category_sub":"02-01. Conversational AI Search","pricing_type":"Subscription","country":"United States","fallback_version":"Sonar Pro"},
    "Poe":                {"manufacturer":"Quora",         "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"Multi-model 2026"},
    "Notion AI":          {"manufacturer":"Notion",        "category_main":"08. Business & Office Productivity","category_sub":"08-02. Document Generation & Editing","pricing_type":"Subscription","country":"United States","fallback_version":"2026"},
    "Canva Magic Studio": {"manufacturer":"Canva",         "category_main":"03. Visual Arts & Design","category_sub":"03-01. Artistic Image Generation","pricing_type":"Subscription","country":"Australia","fallback_version":"2026"},
    "Llama":              {"manufacturer":"Meta",          "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Free","country":"United States","fallback_version":"Llama 4 Scout"},
    "DeepSeek":           {"manufacturer":"DeepSeek",      "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Free","country":"China","fallback_version":"DeepSeek V3"},
    "Mistral Large":      {"manufacturer":"Mistral AI",    "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"France","fallback_version":"Mistral Large 2 (24.11)"},
    "Grok":               {"manufacturer":"xAI",           "category_main":"01. Foundation Models","category_sub":"01-01. General Purpose Language Models","pricing_type":"Subscription","country":"United States","fallback_version":"Grok 3"},
}


# ══ Groq API ══════════════════════════════════════════════════

def groq_call(prompt: str, max_tokens=300, model="llama-3.3-70b-versatile") -> str:
    if not GROQ_API_KEY:
        return ""
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization":f"Bearer {GROQ_API_KEY}","Content-Type":"application/json"},
            json={"model":model,"messages":[{"role":"user","content":prompt}],"max_tokens":max_tokens,"temperature":0.1},
            timeout=30
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"  Groq 오류: {e}")
        return ""

def get_latest_version_via_groq(product_name: str, manufacturer: str, fallback: str) -> str:
    """Groq에게 최신 버전 질문 — 실패 시 fallback 사용"""
    response = groq_call(
        f"What is the exact latest released model/version name of {product_name} by {manufacturer}? "
        f"Reply with ONLY the version or model name, maximum 5 words. "
        f"Examples: 'GPT-4o', 'Claude Sonnet 4.6', 'Llama 4', 'Gemini 2.5 Pro', 'Grok 3'. "
        f"If unsure, reply with the most recent version you know.",
        max_tokens=20,
        model="llama-3.3-70b-versatile"
    )
    response = response.strip().strip('"').strip("'").strip(".")
    # 너무 길거나 문장이면 fallback 사용
    if not response or len(response) > 50 or len(response.split()) > 6:
        print(f"    Groq 감지 실패 → fallback: {fallback}")
        return fallback
    print(f"    Groq 감지: {response}")
    return response

def gen_desc_en(product_name, manufacturer, category, version):
    return groq_call(
        f"Write an 80-120 word expert analysis in English for this AI product. "
        f"Name: {product_name}, Maker: {manufacturer}, Category: {category}, "
        f"Latest version: {version}. Focus on key features and market position. "
        f"Output analysis text only.",
        max_tokens=200
    ) or f"{product_name} by {manufacturer}. {category} AI model. Latest: {version}."

def gen_desc_ko(en_text):
    if not en_text: return ""
    return groq_call(
        f"다음 영문 AI 제품 설명을 자연스러운 한국어로 번역하세요. "
        f"번역문만 출력하세요:\n\n{en_text}",
        max_tokens=300,
        model="llama-3.1-8b-instant"
    )

def gen_glossary_term(product_name, manufacturer, category):
    en = groq_call(
        f"Define '{product_name}' by {manufacturer} in {category} in 30-50 words. "
        f"Output definition text only.",
        max_tokens=100,
        model="llama-3.1-8b-instant"
    ) or f"{product_name}: An AI product by {manufacturer} in {category}."
    time.sleep(0.3)
    ko = groq_call(
        f"다음 AI 용어 정의를 자연스러운 한국어로 번역하세요. 번역문만 출력하세요:\n\n{en}",
        max_tokens=150,
        model="llama-3.1-8b-instant"
    )
    return en, ko


# ══ DB 전체 조회 (페이지네이션) ══════════════════════════════

def get_all_product_names(supabase) -> set:
    """Supabase 1000개 한도 우회 — 페이지네이션으로 전체 조회"""
    all_names = set()
    page_size = 1000
    offset = 0
    while True:
        result = supabase.table("ai_products") \
            .select("product_name") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        for r in result.data:
            all_names.add(r["product_name"].lower())
        if len(result.data) < page_size:
            break
        offset += page_size
    return all_names


# ══ HuggingFace 신규 모델 수집 ════════════════════════════════

def fetch_new_hf_models(existing_names: set) -> list:
    new_models = []
    cutoff = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    for task in HF_TASKS:
        try:
            r = requests.get(HF_API, params={
                "pipeline_tag":task,"sort":"createdAt",
                "direction":-1,"limit":50,"full":True
            }, timeout=15)
            r.raise_for_status()
            for m in r.json():
                model_id   = m.get("id","")
                model_name = model_id.split("/")[-1] if "/" in model_id else model_id
                created    = m.get("createdAt","")[:10]
                if created < cutoff: break
                if model_name.lower() in existing_names: continue
                if m.get("downloads",0) < 50: continue
                # 폰트/비AI 모델 필터
                tags = [t.lower() for t in (m.get("tags") or [])]
                arch = str((m.get("config") or {}).get("model_type", "")).lower()
                if "font" in tags: continue
                if "not-a-language-model" in tags: continue
                if arch == "font": continue
                cat    = TASK_MAP.get(task, TASK_MAP["text-generation"])
                author = model_id.split("/")[0] if "/" in model_id else "Unknown"
                new_models.append({
                    **{k:v for k,v in cat.items() if k!="subcategory_code"},
                    "country":"Global","manufacturer":author,
                    "product_name":model_name,
                    "official_url":f"https://huggingface.co/{model_id}",
                    "verification_status":"Auto-collected (HF)",
                    "pricing_type":"Free","pricing_type_ko":"무료",
                    "service_region":"Global","service_region_ko":"글로벌",
                    "is_research_model":m.get("downloads",0)<1000,
                    "parent_platform":"HuggingFace",
                    "_created":created,
                    "_subcategory_code":cat.get("subcategory_code","01-01"),
                })
                existing_names.add(model_name.lower())
            time.sleep(0.5)
        except Exception as e:
            print(f"  HF 수집 오류 ({task}): {e}")
    return new_models


# ══ 주요 12개 모델 버전 감지 ══════════════════════════════════

def check_major_models(supabase) -> dict:
    result = {"updated":[], "errors":[]}
    print("\n[★] 주요 12개 모델 버전 모니터링 (Groq + fallback)...")

    for product_name, info in MAJOR_MODELS.items():
        try:
            print(f"  → {product_name} 확인 중...")

            # Groq로 버전 감지 (실패 시 fallback)
            latest_version = get_latest_version_via_groq(
                product_name, info["manufacturer"], info["fallback_version"]
            )
            time.sleep(0.5)

            # DB에서 현재 항목 조회
            db_result = supabase.table("ai_products") \
                .select("id,product_name,description,description_ko,verification_status") \
                .ilike("product_name", f"%{product_name.split()[0]}%") \
                .eq("manufacturer", info["manufacturer"]) \
                .limit(1).execute()

            if db_result.data:
                row = db_result.data[0]
                current_status = row.get("verification_status","") or ""
                if latest_version.lower() in current_status.lower():
                    print(f"    이미 최신 — 스킵")
                    continue

                new_en = gen_desc_en(product_name, info["manufacturer"], info["category_sub"], latest_version)
                time.sleep(0.5)
                new_ko = gen_desc_ko(new_en)
                time.sleep(0.5)

                supabase.table("ai_products").update({"updated_at": datetime.datetime.utcnow().isoformat(),
                    "description":         new_en,
                    "description_ko":      new_ko,
                    "verification_status": f"Groq-verified ({latest_version})",
                }).eq("id", row["id"]).execute()

                try:
                    supabase.table("ai_versions").insert({
                        "product_id":   row["id"],
                        "version_name": latest_version,
                        "is_active":    True,
                        "sort_order":   1,
                    }).execute()
                except: pass

                result["updated"].append(f"{product_name}: {latest_version}")
                print(f"    ✅ 업데이트: {latest_version}")

            else:
                new_en = gen_desc_en(product_name, info["manufacturer"], info["category_sub"], latest_version)
                time.sleep(0.5)
                new_ko = gen_desc_ko(new_en)
                time.sleep(0.5)

                supabase.table("ai_products").insert({
                    "category_main":       info["category_main"],
                    "category_sub":        info["category_sub"],
                    "category_main_ko":    info["category_main"],
                    "category_sub_ko":     info["category_sub"],
                    "manufacturer":        info["manufacturer"],
                    "product_name":        product_name,
                    "description":         new_en,
                    "description_ko":      new_ko,
                    "verification_status": f"Groq-verified ({latest_version})",
                    "country":             info["country"],
                    "service_region":      "Global",
                    "service_region_ko":   "글로벌",
                    "pricing_type":        info["pricing_type"],
                    "pricing_type_ko":     "구독" if info["pricing_type"]=="Subscription" else "무료",
                    "is_research_model":   False,
                }).execute()

                result["updated"].append(f"{product_name}: 신규 추가 ({latest_version})")
                print(f"    ✅ 신규 추가: {latest_version}")

        except Exception as e:
            err = f"{product_name}: {str(e)}"
            result["errors"].append(err)
            print(f"    ❌ {err}")
        time.sleep(0.5)

    print(f"  주요 모델 처리: {len(result['updated'])}개")
    return result


# ══ glossary 보강 ═════════════════════════════════════════════

def add_glossary_term(supabase, product_name, manufacturer, category_sub, subcategory_code):
    try:
        exists = supabase.table("glossary").select("term_id").ilike("term_en", product_name).execute()
        if exists.data: return False
        def_en, def_ko = gen_glossary_term(product_name, manufacturer, category_sub)
        supabase.table("glossary").insert({
            "term_id":          str(uuid.uuid4()),
            "subcategory_code": subcategory_code,
            "term_en":          product_name,
            "term_kr":          product_name,
            "definition_en":    def_en,
            "definition_kr":    def_ko,
        }).execute()
        return True
    except Exception as e:
        print(f"  glossary 오류 ({product_name}): {e}")
        return False

def enrich_glossary_korean(supabase, limit=15):
    if not GROQ_API_KEY: return 0
    result = supabase.table("glossary").select("term_id,definition_en,definition_kr").is_("definition_kr","null").limit(limit).execute()
    enriched = 0
    for row in result.data:
        en = row.get("definition_en","")
        if not en: continue
        ko = groq_call(f"다음 AI 용어 정의를 자연스러운 한국어로 번역하세요. 번역문만 출력하세요:\n\n{en}", max_tokens=200, model="llama-3.1-8b-instant")
        if ko:
            supabase.table("glossary").update({"definition_kr":ko,"updated_at":datetime.datetime.utcnow().isoformat()}).eq("term_id",row["term_id"]).execute()
            enriched += 1
            time.sleep(0.3)
    return enriched

def enrich_products_korean(supabase, limit=20):
    if not GROQ_API_KEY: return 0
    result = supabase.table("ai_products") \
        .select("id,product_name,description,description_ko") \
        .is_("description_ko","null") \
        .not_.is_("description","null") \
        .limit(limit).execute()
    enriched = 0
    for row in result.data:
        en = row.get("description","")
        if not en: continue
        ko = gen_desc_ko(en)
        if ko:
            supabase.table("ai_products").update({"updated_at": datetime.datetime.utcnow().isoformat(),"description_ko":ko}).eq("id",row["id"]).execute()
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

    # 페이지네이션으로 전체 제품명 조회
    existing_names = get_all_product_names(supabase)
    print(f"  기존 제품 수: {len(existing_names):,}개")

    log = {
        "date": TODAY,
        "products_added": [],
        "major_updated": [],
        "glossary_added": [],
        "products_ko_enriched": 0,
        "glossary_ko_enriched": 0,
        "errors": [],
    }

    # 1. HF 신규 모델
    print("\n[1] 신규 HF 모델 수집...")
    new_models = fetch_new_hf_models(existing_names)
    print(f"  신규 발견: {len(new_models)}개")
    added = 0
    for m in new_models:
        try:
            desc_en = gen_desc_en(m["product_name"],m["manufacturer"],m["category_sub"],m.get("_created","최신"))
            time.sleep(0.3)
            desc_ko = gen_desc_ko(desc_en)
            time.sleep(0.3)
            insert_data = {k:v for k,v in m.items() if not k.startswith("_")}
            insert_data["description"]    = desc_en
            insert_data["description_ko"] = desc_ko
            supabase.table("ai_products").insert(insert_data).execute()
            g_added = add_glossary_term(supabase, m["product_name"], m["manufacturer"], m["category_sub"], m["_subcategory_code"])
            if g_added: log["glossary_added"].append(m["product_name"])
            log["products_added"].append(m["product_name"])
            added += 1
            print(f"  ✅ 추가: {m['product_name']}")
        except Exception as e:
            log["errors"].append(f"{m['product_name']}: {str(e)}")
    print(f"  추가 완료: {added}개")

    # 2. 주요 12개 모델
    major_result = check_major_models(supabase)
    log["major_updated"] = major_result["updated"]
    log["errors"].extend(major_result["errors"])

    # 3. 기존 제품 한글 보강
    print("\n[3] 기존 제품 한글 보강...")
    p_enriched = enrich_products_korean(supabase, limit=20)
    log["products_ko_enriched"] = p_enriched
    print(f"  완료: {p_enriched}개")

    # 4. glossary 한글 보강
    print("\n[4] glossary 한글 보강...")
    g_enriched = enrich_glossary_korean(supabase, limit=15)
    log["glossary_ko_enriched"] = g_enriched
    print(f"  완료: {g_enriched}개")

    # 5. 로그 저장
    os.makedirs(LOG_DIR, exist_ok=True)
    with open(LOG_FILE,"w",encoding="utf-8") as f:
        json.dump(log,f,ensure_ascii=False,indent=2)

    try:
        supabase.table("update_logs").insert({
            "action":       "daily_update",
            "product_name": f"일괄 업데이트 {TODAY}",
            "detail":       f"HF {added}개 | 주요모델 {len(major_result['updated'])}개 | glossary {len(log['glossary_added'])}개 | 한글보강 {p_enriched}개",
            "source":       "GitHub Actions",
        }).execute()
    except: pass

    print(f"\n{'='*50}")
    print(f" ✅ 완료!")
    print(f"    HF 신규:           {added}개")
    print(f"    주요모델 업데이트:  {len(major_result['updated'])}개")
    print(f"    glossary 신규:     {len(log['glossary_added'])}개")
    print(f"    한글 보강:          {p_enriched}개")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
