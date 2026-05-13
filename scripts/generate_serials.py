"""
시리얼 코드 대량 생성 스크립트 — generate_serials.py
======================================================
책 판매 수량만큼 시리얼 코드를 생성하고 Supabase에 저장합니다.

실행:
    python generate_serials.py --count 1000 --edition 1판

출력:
    serials_1판_1000개.xlsx  (인쇄용)
    serials_1판_1000개.csv   (백업용)
"""

import os
import random
import string
import argparse
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


def generate_code() -> str:
    """XXXX-XXXX-XXXX-XXXX 형식 시리얼 코드 생성"""
    chars = string.ascii_uppercase + string.digits
    # 혼동되기 쉬운 문자 제외 (0, O, I, L, 1)
    chars = ''.join(c for c in chars if c not in 'O0IL1')
    groups = [''.join(random.choices(chars, k=4)) for _ in range(4)]
    return '-'.join(groups)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--count',   type=int, default=1000,  help='생성할 코드 수')
    parser.add_argument('--edition', type=str, default='1판',  help='책 판본')
    args = parser.parse_args()

    print(f"{'='*50}")
    print(f" 시리얼 코드 생성: {args.count}개 ({args.edition})")
    print(f"{'='*50}")

    # Supabase 연결
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # 기존 코드 조회 (중복 방지)
    existing = supabase.table("serial_codes").select("code").execute()
    existing_codes = {r["code"] for r in existing.data}
    print(f"  기존 코드 수: {len(existing_codes):,}개")

    # 코드 생성
    codes = []
    attempts = 0
    while len(codes) < args.count:
        code = generate_code()
        if code not in existing_codes:
            codes.append(code)
            existing_codes.add(code)
        attempts += 1
        if attempts > args.count * 10:
            break

    print(f"  생성 완료: {len(codes):,}개")

    # Supabase에 저장 (배치 100개)
    rows = [{"code": c, "is_used": False, "book_edition": args.edition} for c in codes]
    for i in range(0, len(rows), 100):
        batch = rows[i:i+100]
        supabase.table("serial_codes").insert(batch).execute()
        print(f"  저장 중: {min(i+100, len(rows))}/{len(rows)}", end='\r')
    print(f"\n  ✅ DB 저장 완료")

    # 엑셀 저장 (인쇄용)
    df = pd.DataFrame({"시리얼 코드": codes, "판본": args.edition, "사용여부": "미사용"})
    xlsx_file = f"serials_{args.edition}_{args.count}개.xlsx"
    csv_file  = f"serials_{args.edition}_{args.count}개.csv"
    df.to_excel(xlsx_file, index=False)
    df.to_csv(csv_file, index=False, encoding='utf-8-sig')

    print(f"\n  📄 엑셀: {xlsx_file}")
    print(f"  📄 CSV:  {csv_file}")
    print(f"\n  총 생성: {len(codes):,}개")
    print("  ✅ 완료!")


if __name__ == "__main__":
    main()
