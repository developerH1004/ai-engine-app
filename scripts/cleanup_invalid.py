"""
AI DB 클린업 스크립트 — cleanup_invalid.py v1
=============================================
기능:
  1. 폰트/비AI 모델 탐지 및 선택적 삭제
  2. 서비스 중단 여부 확인 (URL 체크)
  3. 중복 항목 탐지
  4. 선택적 삭제/보존
"""

import os, re, time, requests
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# ── 비AI 키워드 필터 ────────────────────────────────────────
INVALID_KEYWORDS = [
    "font", "gguf-font", "not-a-language-model",
    "monospace", "glyph", "bezier", "rasterization",
    "typeface", "typefont"
]

INVALID_ARCHITECTURES = ["font"]

# ── URL 상태 확인 ────────────────────────────────────────────
def check_url(url: str, timeout=8) -> tuple:
    """URL 상태 확인. (status_code, is_alive) 반환"""
    if not url or not url.startswith("http"):
        return (0, False)
    try:
        r = requests.head(url, timeout=timeout, allow_redirects=True,
                          headers={"User-Agent": "Mozilla/5.0"})
        alive = r.status_code < 400
        return (r.status_code, alive)
    except requests.exceptions.ConnectionError:
        return (0, False)
    except requests.exceptions.Timeout:
        return (-1, None)  # 타임아웃 = 불확실
    except Exception:
        return (0, False)

# ── DB 전체 조회 ─────────────────────────────────────────────
def get_all_products(supabase) -> list:
    all_rows = []
    page_size = 1000
    offset = 0
    while True:
        result = supabase.table("ai_products") \
            .select("id,product_name,manufacturer,official_url,verification_status,parent_platform") \
            .range(offset, offset + page_size - 1) \
            .execute()
        if not result.data:
            break
        all_rows.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size
    return all_rows

# ── 비AI 항목 탐지 ──────────────────────────────────────────
def find_invalid_entries(products: list) -> list:
    invalid = []
    for p in products:
        name = (p.get("product_name") or "").lower()
        url  = (p.get("official_url") or "").lower()
        status = (p.get("verification_status") or "").lower()

        reason = None
        for kw in INVALID_KEYWORDS:
            if kw in name or kw in url:
                reason = f"키워드 '{kw}' 포함"
                break

        if not reason:
            for arch in INVALID_ARCHITECTURES:
                if arch in name:
                    reason = f"아키텍처 '{arch}'"
                    break

        if reason:
            invalid.append({**p, "_reason": reason})

    return invalid

# ── HuggingFace URL 상태 배치 확인 ──────────────────────────
def find_dead_hf_models(products: list, sample_limit=200) -> list:
    """HuggingFace 모델 중 URL 죽은 것 탐지 (샘플 확인)"""
    hf_products = [
        p for p in products
        if "huggingface.co" in (p.get("official_url") or "")
    ][:sample_limit]

    dead = []
    print(f"\n  HF 모델 URL 확인 중... ({len(hf_products)}개 샘플)")
    for i, p in enumerate(hf_products):
        url = p.get("official_url", "")
        status, alive = check_url(url)
        if alive is False:
            dead.append({**p, "_http_status": status, "_reason": f"HTTP {status} — URL 응답 없음"})
            print(f"  ❌ [{i+1}] {p['product_name']} → {status}")
        elif alive is None:
            print(f"  ⏱  [{i+1}] {p['product_name']} → 타임아웃 (보류)")
        else:
            if (i+1) % 20 == 0:
                print(f"  ✅ [{i+1}/{len(hf_products)}] 진행 중...")
        time.sleep(0.3)

    return dead

# ── 중복 탐지 ────────────────────────────────────────────────
def find_duplicates(products: list) -> list:
    seen = {}
    duplicates = []
    for p in products:
        key = p.get("product_name", "").lower().strip()
        if key in seen:
            duplicates.append({**p, "_duplicate_of": seen[key]["id"], "_reason": "중복 product_name"})
        else:
            seen[key] = p
    return duplicates

# ── 선택적 삭제 ──────────────────────────────────────────────
def interactive_delete(supabase, candidates: list, category_name: str):
    if not candidates:
        print(f"\n  [{category_name}] 해당 항목 없음")
        return

    print(f"\n{'='*60}")
    print(f"  [{category_name}] {len(candidates)}개 발견")
    print(f"{'='*60}")

    for i, item in enumerate(candidates):
        print(f"\n  [{i+1}/{len(candidates)}]")
        print(f"  이름:   {item.get('product_name')}")
        print(f"  제조사: {item.get('manufacturer')}")
        print(f"  URL:    {item.get('official_url', 'N/A')}")
        print(f"  사유:   {item.get('_reason')}")
        print(f"  ID:     {item.get('id')}")

        choice = input("\n  삭제(d) / 보존(k) / 전체삭제(a) / 전체보존(n) / 종료(q): ").strip().lower()

        if choice == 'q':
            print("  종료합니다.")
            break
        elif choice == 'a':
            # 나머지 전체 삭제
            remaining = candidates[i:]
            ids = [r["id"] for r in remaining]
            for rid in ids:
                supabase.table("ai_products").delete().eq("id", rid).execute()
                print(f"  🗑  삭제: {rid}")
            print(f"  총 {len(ids)}개 삭제 완료")
            break
        elif choice == 'n':
            print("  나머지 전체 보존")
            break
        elif choice == 'd':
            supabase.table("ai_products").delete().eq("id", item["id"]).execute()
            print(f"  🗑  삭제됨: {item['product_name']}")
        else:
            print(f"  ✅ 보존: {item['product_name']}")

# ══ 메인 ═════════════════════════════════════════════════════
def main():
    print("="*60)
    print("  AI DB 클린업 스크립트")
    print("="*60)

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("SUPABASE_URL 또는 SUPABASE_KEY 환경변수 없음")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase 연결 완료")

    print("\n전체 제품 조회 중...")
    products = get_all_products(supabase)
    print(f"  총 {len(products):,}개 조회 완료")

    print("\n실행할 작업을 선택하세요:")
    print("  1. 비AI/폰트 항목 탐지 및 삭제")
    print("  2. URL 사망 HF 모델 탐지 및 삭제 (시간 소요)")
    print("  3. 중복 항목 탐지 및 삭제")
    print("  4. 전체 실행")
    print("  q. 종료")

    choice = input("\n선택: ").strip().lower()

    if choice in ("1", "4"):
        print("\n[1] 비AI/폰트 항목 탐지...")
        invalid = find_invalid_entries(products)
        print(f"  발견: {len(invalid)}개")
        interactive_delete(supabase, invalid, "비AI/폰트 항목")

    if choice in ("2", "4"):
        sample = input("\n샘플 확인 개수 입력 (기본 100): ").strip()
        limit = int(sample) if sample.isdigit() else 100
        dead = find_dead_hf_models(products, sample_limit=limit)
        print(f"\n  URL 사망 모델: {len(dead)}개")
        interactive_delete(supabase, dead, "URL 사망 모델")

    if choice in ("3", "4"):
        print("\n[3] 중복 항목 탐지...")
        dupes = find_duplicates(products)
        print(f"  발견: {len(dupes)}개")
        interactive_delete(supabase, dupes, "중복 항목")

    print("\n✅ 클린업 완료")

if __name__ == "__main__":
    main()
