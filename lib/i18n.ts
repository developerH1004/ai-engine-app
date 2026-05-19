// ── GAIT 69 AI MAP — 한/영 번역 딕셔너리 ─────────────────
export type Lang = 'ko' | 'en'

export const t: Record<string, Record<Lang, string>> = {
  // 사이트 타이틀
  siteTitle:      { ko: '이거봐!!! AI가 다 모였어', en: 'Wait! They\'re ALL Here?!' },
  siteDesc:       { ko: '전 세계 실존하는 모든 AI를 한눈에.', en: 'Every real-world AI on the planet, at a glance.' },

  // 헤더 네비
  navExplore:     { ko: '탐색', en: 'Explore' },
  navRequest:     { ko: '등록 요청', en: 'Submit Request' },
  navAuth:        { ko: '시리얼 인증', en: 'Serial Auth' },

  // 메인 히어로 — 새 책 제목
  heroSubKo:      { ko: 'AI 지도 완전판', en: 'The Complete AI Atlas' },
  heroLine1:      { ko: '이거봐!!!', en: 'Wait!' },
  heroLine2:      { ko: 'AI가 다 모였어', en: "They're ALL Here?!" },
  heroLine3:      { ko: '', en: '- Your Complete Guide to AIs' },
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

  // 프롬프트
  promptBtn:      { ko: '📋 프롬프트 가이드', en: '📋 Prompt Guide' },
  promptTitle:    { ko: 'AI 프롬프트 가이드', en: 'AI Prompt Guide' },
  promptType1:    { ko: '일반(범용) 작성 방법', en: 'General Method' },
  promptType2:    { ko: '전문가용 작성 방법', en: 'Expert Method' },
  promptType3:    { ko: '특정분야 작성 방법', en: 'Domain Method' },
  promptType4:    { ko: '일반(범용) 사례', en: 'General Examples' },
  promptType5:    { ko: '전문가용 사례', en: 'Expert Examples' },
  promptType6:    { ko: '특정분야 사례', en: 'Domain Examples' },
  promptInput:    { ko: '프롬프트', en: 'Prompt' },
  promptTips:     { ko: '출력 팁', en: 'Output Tips' },
  promptParams:   { ko: '고급 파라미터', en: 'Advanced Params' },
  promptPrint:    { ko: '🖨️ PDF 출력', en: '🖨️ Print PDF' },
  promptClose:    { ko: '닫기', en: 'Close' },
  promptNone:     { ko: '이 AI에 해당하는 프롬프트가 없습니다.', en: 'No prompts available for this AI.' },

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

  // 대분류
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
  '10. 교육 및 학술':            { ko: '교육 및 학술 (에듀테크)',en: 'Education & Academic' },
  '11. 전문 산업군':             { ko: '전문 산업군',            en: 'Specialized Industry Verticals' },
  '12. 하드웨어 및 로보틱스':    { ko: '하드웨어 및 로보틱스',   en: 'Hardware & Robotics' },
  '13. 인프라 및 보안':          { ko: '인프라 및 보안',         en: 'Infrastructure & Security' },
}
