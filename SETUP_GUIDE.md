# 자동 업데이트 엔진 + 시리얼 코드 설정 가이드

## 파일 위치

```
C:\dogfish\ai-engine-app\
├── .github\
│   └── workflows\
│       └── auto_update.yml     ← GitHub Actions 워크플로우
└── scripts\
    ├── auto_update.py          ← 자동 업데이트 스크립트
    └── generate_serials.py     ← 시리얼 코드 생성 스크립트
```

---

## 1단계: Groq API 키 발급 (무료)

1. https://console.groq.com 접속
2. 회원가입 (GitHub 계정으로 가능)
3. API Keys → Create API Key
4. 키 복사해서 메모장에 저장

---

## 2단계: GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

추가할 Secrets:
```
SUPABASE_URL         = https://pnipcqpchugsdqsthddl.supabase.co
SUPABASE_SERVICE_KEY = (Supabase → Settings → API → service_role 키)
GROQ_API_KEY         = (Groq에서 발급한 키)
```

※ SUPABASE_SERVICE_KEY는 Supabase 대시보드 Settings → API → Secret keys 에서 확인

---

## 3단계: 파일 복사 후 GitHub 푸시

```powershell
cd C:\dogfish\ai-engine-app

# 폴더 생성
mkdir .github\workflows
mkdir scripts

# 파일 복사 후
git add .
git commit -m "Add auto-update engine"
git push
```

푸시하면 GitHub Actions가 자동으로 매일 실행됩니다.

---

## 4단계: 시리얼 코드 생성

```powershell
cd C:\dogfish\ai-engine-app
pip install supabase pandas openpyxl python-dotenv

# 1,000개 생성 (1판)
python scripts/generate_serials.py --count 1000 --edition 1판

# 결과: serials_1판_1000개.xlsx (인쇄소에 전달)
```

---

## 자동 실행 스케줄

| 시간 (한국) | 작업 |
|------------|------|
| 매일 오전 9시 | 신규 AI 수집 + DB 추가 |
| 매일 낮 12시 | 분석 보강 |
| 매일 자정 | 전체 정리 + 로그 저장 |
