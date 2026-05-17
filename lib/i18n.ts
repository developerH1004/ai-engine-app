// ── GAIT 69 AI MAP — 한/영 번역 딕셔너리 ─────────────────
export type Lang = 'ko' | 'en'

export const t: Record<string, Record<Lang, string>> = {
  // 사이트 타이틀
  siteTitle:      { ko: '이거봐! AI가 모두 모였어', en: 'Look! All AI in One Place' },
  siteDesc:       { ko: '전 세계 실존하는 모든 AI를 한눈에.', en: 'Every real-world AI on the planet, at a glance.' },

  // 헤더 네비
  navExplore:     { ko: '탐색', en: 'Explore' },
  navRequest:     { ko: '등록 요청', en: 'Submit Request' },
  navAuth:        { ko: '시리얼 인증', en: 'Serial Auth' },

  // 메인 히어로
  heroLine1:      { ko: '이거봐!', en: 'Look!' },
  heroLine2:      { ko: 'AI가 모두 모였어', en: 'All AI in One Place' },
  heroDesc:       { ko: '전 세계 실존하는 모든 AI를 한눈에.\n대분류·세분류별 탐색, 전문가 분석, 실시간 업데이트.', en: 'Every real-world AI on the planet, at a glance.\nBrowse by category, expert analysis, live updates.' },
  liveUpdate:     { ko: 'LIVE DATABASE · 매일 자정 자동 업데이트', en: 'LIVE DATABASE · Auto-updated daily at midnight' },

  // 카운트 배지
  totalRegistered: { ko: '개 AI 등록됨', en: 'AI products indexed' },
  searchResult:    { ko: '검색 결과', en: 'results' },
  allCategory:     { ko: '전체', en: 'All' },

  // 검색
  searchPlaceholder: { ko: 'AI 이름, 제조사, 기능으로 검색... (전체 DB 검색)', en: 'Search by name, manufacturer, feature... (full DB)' },

  // 카테고리 네비
  catAll:         { ko: '전체', en: 'All' },
  subAll:         { ko: '전체', en: 'All' },

  // 제품 카드
  officialSite:   { ko: '공식 사이트', en: 'Official Site' },
  comparing:      { ko: '✓ 비교중', en: '✓ Comparing' },
  addCompare:     { ko: '+ 비교', en: '+ Compare' },
  researchModel:  { ko: '연구모델', en: 'Research' },
  expand:         { ko: '더보기 ▼', en: 'More ▼' },
  collapse:       { ko: '접기 ▲', en: 'Less ▲' },

  // 비교 바
  compareSelected: { ko: '⚖️ 비교 선택:', en: '⚖️ Selected:' },
  compareBtn:     { ko: '비교하기', en: 'Compare' },
  compareReset:   { ko: '초기화', en: 'Reset' },
  compareMax:     { ko: '최대 10개까지 비교 가능합니다.', en: 'You can compare up to 10 items.' },

  // 비교 패널
  compareTitle:   { ko: 'AI 비교', en: 'AI Comparison' },
  closeBtn:       { ko: '✕ 닫기', en: '✕ Close' },
  printBtn:       { ko: '🖨️ PDF 출력', en: '🖨️ Print PDF' },
  manufacturer:   { ko: '제조사', en: 'Manufacturer' },
  country:        { ko: '국가', en: 'Country' },
  category:       { ko: '대분류', en: 'Category' },
  subcategory:    { ko: '세분류', en: 'Subcategory' },
  verification:   { ko: '검증상태', en: 'Verification' },
  activeVersions: { ko: '운영버전 수', en: 'Active Versions' },
  deprVersions:   { ko: '구(중단)버전', en: 'Discontinued' },
  latestVersion:  { ko: '최신 버전', en: 'Latest Version' },
  expertAnalysis: { ko: '전문가 분析', en: 'Expert Analysis' },
  status:         { ko: '구분', en: 'Status' },
  inService:      { ko: '서비스 중', en: 'In Service' },

  // 페이지네이션
  prevPage:       { ko: '← 이전', en: '← Prev' },
  nextPage:       { ko: '다음 →', en: 'Next →' },
  showing:        { ko: '개 중', en: 'of' },
  shown:          { ko: '개 표시', en: 'shown' },
  page:           { ko: '페이지', en: 'Page' },
  resetFilter:    { ko: '✕ 초기화', en: '✕ Reset' },
  noResult:       { ko: '검색 결과가 없습니다.', en: 'No results found.' },

  // 푸터
  copyright:      { ko: '© 2025 DO HUN, KIM. All rights reserved.', en: '© 2025 DO HUN, KIM. All rights reserved.' },
  doiLabel:       { ko: '데이터 출처 및 분류체계', en: 'Data Source & Taxonomy' },
  doiName:        { ko: 'GAIT 69: Global AI Index Taxonomy', en: 'GAIT 69: Global AI Index Taxonomy' },
  zenodoLabel:    { ko: 'Zenodo DOI', en: 'Zenodo DOI' },

  // 대분류 (GAIT 69 공식명)
  cat01: { ko: '파운데이션 모델', en: 'Foundation Models (FM)' },
  cat02: { ko: '검색 및 지식 탐구', en: 'Search & Knowledge Discovery' },
  cat03: { ko: '비주얼 아트 및 디자인', en: 'Visual Art & Generative Design' },
  cat04: { ko: '영상 및 모션 그래픽', en: 'Video & Motion Synthesis' },
  cat05: { ko: '오디오 및 음악', en: 'Audio & Music Generation' },
  cat06: { ko: '개발 및 코딩', en: 'Development & Coding' },
  cat07: { ko: '에이전트 및 자동화', en: 'Agents & Automation' },
  cat08: { ko: '비즈니스 및 사무 생산성', en: 'Business & Office Productivity' },
  cat09: { ko: '마케팅 및 콘텐츠 제작', en: 'Marketing & Content Creation' },
  cat10: { ko: '교육 및 학술 (에듀테크)', en: 'Education & Academic' },
  cat11: { ko: '전문 산업군', en: 'Specialized Industry Verticals' },
  cat12: { ko: '하드웨어 및 로보틱스', en: 'Hardware & Robotics' },
  cat13: { ko: '인프라 및 보안', en: 'Infrastructure & Security' },
}

// DB category_main 값 → 번역
export const MAIN_CAT_LABEL: Record<string, Record<Lang, string>> = {
  '01. 파운데이션 모델':         { ko: '파운데이션 모델',       en: 'Foundation Models (FM)' },
  '02. 검색 및 지식 탐구':       { ko: '검색 및 지식 탐구',     en: 'Search & Knowledge Discovery' },
  '03. 비주얼 아트 및 디자인':   { ko: '비주얼 아트 및 디자인', en: 'Visual Art & Generative Design' },
  '04. 영상 및 모션 그래픽':     { ko: '영상 및 모션 그래픽',   en: 'Video & Motion Synthesis' },
  '05. 오디오 및 음악':          { ko: '오디오 및 음악',         en: 'Audio & Music Generation' },
  '06. 개발 및 코딩':            { ko: '개발 및 코딩',           en: 'Development & Coding' },
  '07. 에이전트 및 자동화':      { ko: '에이전트 및 자동화',     en: 'Agents & Automation' },
  '08. 비즈니스 및 사무 생산성': { ko: '비즈니스 및 사무 생산성',en: 'Business & Office Productivity' },
  '09. 마케팅 및 콘텐츠 제작':   { ko: '마케팅 및 콘텐츠 제작', en: 'Marketing & Content Creation' },
  '10. 교육 및 학술 (에듀테크)': { ko: '교육 및 학술 (에듀테크)',en: 'Education & Academic' },
  '11. 전문 산업군':             { ko: '전문 산업군',             en: 'Specialized Industry Verticals' },
  '12. 하드웨어 및 로보틱스':    { ko: '하드웨어 및 로보틱스',   en: 'Hardware & Robotics' },
  '13. 인프라 및 보안':          { ko: '인프라 및 보안',         en: 'Infrastructure & Security' },
}

// DB category_sub 값 → 번역 (접두 번호 제거 후 표시용)
export const SUB_CAT_LABEL: Record<string, Record<Lang, string>> = {
  '01-01. 범용 언어 모델':                    { ko: '범용 언어 모델',             en: 'General Purpose Language Models (Frontier LLMs)' },
  '01-02. 소형 언어 모델':                    { ko: '소형 언어 모델',             en: 'Small Language Models (SLMs)' },
  '01-03. 멀티모달 통합 지능':                { ko: '멀티모달 통합 지능',         en: 'Multimodal Integrated Intelligence' },
  '01-04. 논리 추론 특화':                    { ko: '논리 추론 특화',             en: 'Logical Reasoning Specialized Models' },
  '01-05. 기업 특화 파인튜닝 모델':           { ko: '기업 특화 파인튜닝 모델',   en: 'Enterprise-Specific Fine-Tuned Models' },
  '02-01. 대화형 AI 검색 엔진':               { ko: '대화형 AI 검색 엔진',       en: 'Conversational AI Search Engines' },
  '02-02. 학술 및 논문 리서치':               { ko: '학술 및 논문 리서치',       en: 'Academic & Paper Research' },
  '02-03. 사실 검증 및 데이터 팩트체크':      { ko: '사실 검증 및 데이터 팩트체크', en: 'Fact Verification & Data Fact-Checking' },
  '02-04. 기업용 지능형 검색':               { ko: '기업용 지능형 검색',         en: 'Enterprise Intelligent Search' },
  '02-05. 특허 및 규제 분析':                { ko: '특허 및 규제 분석',          en: 'Patent & Regulatory Analysis' },
  '02-06. AI 브라우저 및 웹 에이전트':        { ko: 'AI 브라우저 및 웹 에이전트', en: 'AI Browsers & Web Agents' },
  '03-01. 예술적 이미지 생성':               { ko: '예술적 이미지 생성',         en: 'Artistic Image Generation' },
  '03-02. 이미지 편집 및 리터칭':            { ko: '이미지 편집 및 리터칭',     en: 'Image Editing & Retouching' },
  '03-03. 브랜드 및 로고 디자인':            { ko: '브랜드 및 로고 디자인',     en: 'Brand & Logo Design' },
  '03-04. UI/UX 및 웹 레이아웃':             { ko: 'UI/UX 및 웹 레이아웃',      en: 'UI/UX & Web Layout' },
  '03-05. 3D 모델링 및 에셋 생성':           { ko: '3D 모델링 및 에셋 생성',    en: '3D Modeling & Asset Generation' },
  '03-06. 건축 및 공간/인테리어 디자인':     { ko: '건축 및 공간/인테리어 디자인', en: 'Architecture & Spatial/Interior Design' },
  '03-07. 캐릭터 및 게임 아트 디자인':       { ko: '캐릭터 및 게임 아트 디자인', en: 'Character & Game Art Design' },
  '04-01. 텍스트-투-비디오':                 { ko: '텍스트-투-비디오',          en: 'Text-to-Video (T2V)' },
  '04-02. AI 아바타 및 가상 휴먼':           { ko: 'AI 아바타 및 가상 휴먼',    en: 'AI Avatars & Virtual Humans' },
  '04-03. 영상 번역 및 더빙':               { ko: '영상 번역 및 더빙',          en: 'Video Translation & Dubbing' },
  '04-04. 자동 영상 편집':                  { ko: '자동 영상 편집',             en: 'Automated Video Editing' },
  '04-05. VFX 및 특수 효과':               { ko: 'VFX 및 특수 효과',           en: 'VFX & Special Effects' },
  '04-06. 실시간 영상 향상':               { ko: '실시간 영상 향상',            en: 'Real-Time Video Enhancement' },
  '04-07. 에니메이션 및 모션 캡쳐':        { ko: '애니메이션 및 모션 캡처',     en: 'Animation & Motion Capture' },
  '05-01. 음성 합성 및 TTS':              { ko: '음성 합성 및 TTS',            en: 'Speech Synthesis & TTS' },
  '05-02. 음성 변환 및 클로닝':            { ko: '음성 변환 및 클로닝',         en: 'Voice Conversion & Cloning' },
  '05-03. AI 작곡 및 배경음악':            { ko: 'AI 작곡 및 배경음악',         en: 'AI Music Composition & BGM' },
  '05-04. 효과음 생성':                   { ko: '효과음 생성',                  en: 'Sound Effect Generation' },
  '05-05. 오디오 포스트 프로덕션':         { ko: '오디오 포스트 프로덕션',       en: 'Audio Post-Production' },
  '06-01. AI 코딩 어시스턴트':            { ko: 'AI 코딩 어시스턴트',           en: 'AI Coding Assistants' },
  '06-02. 코드 리뷰 및 보안 취약점 분析': { ko: '코드 리뷰 및 보안 취약점 분析', en: 'Code Review & Security Vulnerability Analysis' },
  '06-03. 노코드/로우코드 빌더':           { ko: '노코드/로우코드 빌더',         en: 'Low-Code / No-Code (LCNC) Builders' },
  '06-04. 데이터베이스 설계 및 쿼리 최적화': { ko: '데이터베이스 설계 및 쿼리 최적화', en: 'Database Design & Query Optimization' },
  '06-05. 문서화 및 API 관리':            { ko: '문서화 및 API 관리',           en: 'Documentation & API Management' },
  '07-01. 자율 행동 에이전트':            { ko: '자율 행동 에이전트',           en: 'Autonomous Behavioral Agents' },
  '07-02. 워크플로우 통합 자동화':         { ko: '워크플로우 통합 자동화',       en: 'Workflow Integration Automation' },
  '07-03. 고객 서비스(CS) 에이전트':      { ko: '고객 서비스(CS) 에이전트',     en: 'Customer Service Agents' },
  '07-04. 개인용 업무 비서':              { ko: '개인용 업무 비서',             en: 'Personal Work Assistants' },
  '07-05. AI 안전.정렬.레드팀':           { ko: 'AI 안전·정렬·레드팀',          en: 'AI Safety, Evaluation & Red Teaming' },
  '08-01. 회의 기록 및 요약':             { ko: '회의 기록 및 요약',            en: 'Meeting Recording & Summarization' },
  '08-02. 문서 생성 및 편집':             { ko: '문서 생성 및 편집',            en: 'Document Generation & Editing' },
  '08-03. 데이터 시각화 및 차트 생성':    { ko: '데이터 시각화 및 차트 생성',   en: 'Data Visualization & Chart Generation' },
  '08-04. 프리젠테이션 자동 제작':        { ko: '프레젠테이션 자동 제작',        en: 'Automated Presentation Production' },
  '08-05. 문서 처리 및 OCR':             { ko: '문서 처리 및 OCR',             en: 'Document Processing & OCR' },
  '09-01. 카피라이팅 및 광고 문구':       { ko: '카피라이팅 및 광고 문구',       en: 'Copywriting & Ad Copy' },
  '09-02. 이커머스 마케팅 에셋':          { ko: '이커머스 마케팅 에셋',          en: 'E-Commerce Marketing Assets' },
  '09-03. SNS 관리 및 성과 분析':        { ko: 'SNS 관리 및 성과 분析',        en: 'SNS Management & Performance Analytics' },
  '09-04. SEO 최적화 전략':              { ko: 'SEO 최적화 전략',               en: 'SEO Optimization Strategies' },
  '09-05. AI 인플루언서 및 버추얼 크리에이터': { ko: 'AI 인플루언서 및 버추얼 크리에이터', en: 'AI Influencers & Virtual Creators' },
  '10-01. 개인 맞춤형 튜터링':           { ko: '개인 맞춤형 튜터링',           en: 'Personalized Tutoring' },
  '10-02. 외국어 학습 및 대화':          { ko: '외국어 학습 및 대화',          en: 'Foreign Language Learning & Conversation' },
  '10-03. 자동 채점 및 피드백':          { ko: '자동 채점 및 피드백',          en: 'Automated Grading & Feedback' },
  '10-04. 학술적 글쓰기 어시스턴트':     { ko: '학술적 글쓰기 어시스턴트',     en: 'Academic Writing Assistants' },
  '11-01. 의료 및 바이오':              { ko: '의료 및 바이오',               en: 'Healthcare & Biotechnology' },
  '11-02. 법률 및 컴플라이언스':         { ko: '법률 및 컴플라이언스',         en: 'Legal & Compliance' },
  '11-03. 금융 및 핀테크':              { ko: '금융 및 핀테크',               en: 'Finance & FinTech' },
  '11-04. 부동산 및 건축':              { ko: '부동산 및 건축',               en: 'Real Estate & Architecture' },
  '11-05. 유통 및 물류':               { ko: '유통 및 물류',                 en: 'Retail & Logistics' },
  '11-06. 농업 및 스마트팜':            { ko: '농업 및 스마트팜',             en: 'Agriculture & Smart Farming' },
  '11-07. 에너지 및 기후 테크':         { ko: '에너지 및 기후 테크',          en: 'Energy & Climate Tech' },
  '12-01. 휴머노이드 및 범용 로봇':      { ko: '휴머노이드 및 범용 로봇',      en: 'Humanoid & General-Purpose Robots' },
  '12-02. 산업용 협동 로봇':            { ko: '산업용 협동 로봇',             en: 'Industrial Collaborative Robots' },
  '12-03. 자율주행 및 모빌리티':         { ko: '자율주행 및 모빌리티',         en: 'Autonomous Driving & Mobility' },
  '12-04. 스마트 센서 및 웨어러블':      { ko: '스마트 센서 및 웨어러블',      en: 'Smart Sensors & Wearables' },
  '13-01. AI 반도체 및 가속기':         { ko: 'AI 반도체 및 가속기',          en: 'AI Semiconductors & Accelerators' },
  '13-02. MLOps 및 모델 서빙 플랫폼':   { ko: 'MLOps 및 모델 서빙 플랫폼',   en: 'MLOps, Model Serving & Data Ops' },
  '13-03. 사이버 보안 및 위협 탐지':    { ko: '사이버 보안 및 위협 탐지',     en: 'Cybersecurity & Threat Detection' },
  '13-04. 소버린 AI 및 프라이빗 클라우드': { ko: '소버린 AI 및 프라이빗 클라우드', en: 'Sovereign AI & Private Cloud' },
}
