'use client'
import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/LangContext'
import { t } from '@/lib/i18n'
import LinkHub from '@/components/LinkHub'

// ── 카테고리 데이터 (CategoryNav에서 복사) ──────────────────
const CATEGORIES_EN: Record<string, string[]> = {
  '01. Foundation Models': ['01-01. General Purpose Language Models (Frontier LLMs)','01-02. Small Language Models (SLMs)','01-03. Multimodal Integrated Intelligence','01-04. Logical Reasoning Specialized Models','01-05. Enterprise-Specific Fine-Tuned Models'],
  '02. Search & Knowledge Discovery': ['02-01. Conversational AI Search Engines','02-02. Academic & Paper Research','02-03. Fact Verification & Fact-Checking','02-04. Enterprise Intelligent Search','02-05. Patent & Regulatory Analysis','02-06. AI Browsers & Web Agents'],
  '03. Visual Art & Generative Design': ['03-01. Artistic Image Generation','03-02. Image Editing & Retouching','03-03. Brand & Logo Design','03-04. UI/UX & Web Layout','03-05. 3D Modeling & Asset Generation','03-06. Architecture & Spatial/Interior Design','03-07. Character & Game Art Design'],
  '04. Video & Motion Synthesis': ['04-01. Text-to-Video (T2V)','04-02. AI Avatars & Virtual Humans','04-03. Video Translation & Dubbing','04-04. Automated Video Editing','04-05. VFX & Special Effects','04-06. Real-Time Video Enhancement','04-07. Animation & Motion Capture'],
  '05. Audio & Music Generation': ['05-01. Speech Synthesis & TTS','05-02. Voice Conversion & Cloning','05-03. AI Music Composition & BGM','05-04. Sound Effect Generation','05-05. Audio Post-Production'],
  '06. Development & Coding': ['06-01. AI Coding Assistants','06-02. Code Review & Security Vulnerability Analysis','06-03. Low-Code / No-Code (LCNC) Builders','06-04. Database Design & Query Optimization','06-05. Documentation & API Management'],
  '07. Agents & Automation': ['07-01. Autonomous Behavioral Agents','07-02. Workflow Integration Automation','07-03. Customer Service Agents','07-04. Personal Work Assistants','07-05. AI Safety, Evaluation & Red Teaming'],
  '08. Business & Office Productivity': ['08-01. Meeting Recording & Summarization','08-02. Document Generation & Editing','08-03. Data Visualization & Chart Generation','08-04. Automated Presentation Production','08-05. Document Processing & OCR'],
  '09. Marketing & Content Creation': ['09-01. Copywriting & Ad Copy','09-02. E-Commerce Marketing Assets','09-03. SNS Management & Performance Analytics','09-04. SEO Optimization Strategies','09-05. AI Influencers & Virtual Creators'],
  '10. Education & Academic': ['10-01. Personalized Tutoring','10-02. Foreign Language Learning & Conversation','10-03. Automated Grading & Feedback','10-04. Academic Writing Assistants'],
  '11. Specialized Industries': ['11-01. Healthcare & Biotechnology','11-02. Legal & Compliance','11-03. Finance & FinTech','11-04. Real Estate & Architecture','11-05. Retail & Logistics','11-06. Agriculture & Smart Farming','11-07. Energy & Climate Tech'],
  '12. Hardware & Robotics': ['12-01. Humanoid & General-Purpose Robots','12-02. Industrial Collaborative Robots','12-03. Autonomous Driving & Mobility','12-04. Smart Sensors & Wearables'],
  '13. Infrastructure & Security': ['13-01. AI Semiconductors & Accelerators','13-02. MLOps, Model Serving & Data Ops','13-03. Cybersecurity & Threat Detection','13-04. Sovereign AI & Private Cloud'],
}

const MAIN_KO: Record<string, string> = {
  '01. Foundation Models':'파운데이션 모델','02. Search & Knowledge Discovery':'검색 및 지식 탐구',
  '03. Visual Art & Generative Design':'비주얼 아트 및 디자인','04. Video & Motion Synthesis':'영상 및 모션 그래픽',
  '05. Audio & Music Generation':'오디오 및 음악','06. Development & Coding':'개발 및 코딩',
  '07. Agents & Automation':'에이전트 및 자동화','08. Business & Office Productivity':'비즈니스 및 사무 생산성',
  '09. Marketing & Content Creation':'마케팅 및 콘텐츠 제작','10. Education & Academic':'교육 및 학술',
  '11. Specialized Industries':'전문 산업군','12. Hardware & Robotics':'하드웨어 및 로보틱스',
  '13. Infrastructure & Security':'인프라 및 보안',
}

const SUB_KO: Record<string, string> = {
  '01-01. General Purpose Language Models (Frontier LLMs)':'범용 언어 모델','01-02. Small Language Models (SLMs)':'소형 언어 모델','01-03. Multimodal Integrated Intelligence':'멀티모달 통합 지능','01-04. Logical Reasoning Specialized Models':'논리 추론 특화','01-05. Enterprise-Specific Fine-Tuned Models':'기업 특화 파인튜닝',
  '02-01. Conversational AI Search Engines':'대화형 AI 검색','02-02. Academic & Paper Research':'학술 및 논문 리서치','02-03. Fact Verification & Fact-Checking':'사실 검증 및 팩트체크','02-04. Enterprise Intelligent Search':'기업용 지능형 검색','02-05. Patent & Regulatory Analysis':'특허 및 규제 분析','02-06. AI Browsers & Web Agents':'AI 브라우저 및 웹 에이전트',
  '03-01. Artistic Image Generation':'예술적 이미지 생성','03-02. Image Editing & Retouching':'이미지 편집 및 리터칭','03-03. Brand & Logo Design':'브랜드 및 로고 디자인','03-04. UI/UX & Web Layout':'UI/UX 및 웹 레이아웃','03-05. 3D Modeling & Asset Generation':'3D 모델링 및 에셋 생성','03-06. Architecture & Spatial/Interior Design':'건축 및 공간/인테리어','03-07. Character & Game Art Design':'캐릭터 및 게임 아트',
  '04-01. Text-to-Video (T2V)':'텍스트-투-비디오','04-02. AI Avatars & Virtual Humans':'AI 아바타 및 가상 휴먼','04-03. Video Translation & Dubbing':'영상 번역 및 더빙','04-04. Automated Video Editing':'자동 영상 편집','04-05. VFX & Special Effects':'VFX 및 특수 효과','04-06. Real-Time Video Enhancement':'실시간 영상 향상','04-07. Animation & Motion Capture':'애니메이션 및 모션 캡처',
  '05-01. Speech Synthesis & TTS':'음성 합성 및 TTS','05-02. Voice Conversion & Cloning':'음성 변환 및 클로닝','05-03. AI Music Composition & BGM':'AI 작곡 및 배경음악','05-04. Sound Effect Generation':'효과음 생성','05-05. Audio Post-Production':'오디오 포스트 프로덕션',
  '06-01. AI Coding Assistants':'AI 코딩 어시스턴트','06-02. Code Review & Security Vulnerability Analysis':'코드 리뷰 및 보안 분析','06-03. Low-Code / No-Code (LCNC) Builders':'노코드/로우코드 빌더','06-04. Database Design & Query Optimization':'DB 설계 및 쿼리 최적화','06-05. Documentation & API Management':'문서화 및 API 관리',
  '07-01. Autonomous Behavioral Agents':'자율 행동 에이전트','07-02. Workflow Integration Automation':'워크플로우 통합 자동화','07-03. Customer Service Agents':'고객 서비스 에이전트','07-04. Personal Work Assistants':'개인용 업무 비서','07-05. AI Safety, Evaluation & Red Teaming':'AI 안전·정렬·레드팀',
  '08-01. Meeting Recording & Summarization':'회의 기록 및 요약','08-02. Document Generation & Editing':'문서 생성 및 편집','08-03. Data Visualization & Chart Generation':'데이터 시각화 및 차트','08-04. Automated Presentation Production':'프레젠테이션 자동 제작','08-05. Document Processing & OCR':'문서 처리 및 OCR',
  '09-01. Copywriting & Ad Copy':'카피라이팅 및 광고 문구','09-02. E-Commerce Marketing Assets':'이커머스 마케팅 에셋','09-03. SNS Management & Performance Analytics':'SNS 관리 및 성과 分析','09-04. SEO Optimization Strategies':'SEO 최적화 전략','09-05. AI Influencers & Virtual Creators':'AI 인플루언서 및 버추얼',
  '10-01. Personalized Tutoring':'개인 맞춤형 튜터링','10-02. Foreign Language Learning & Conversation':'외국어 학습 및 대화','10-03. Automated Grading & Feedback':'자동 채점 및 피드백','10-04. Academic Writing Assistants':'학술적 글쓰기 어시스턴트',
  '11-01. Healthcare & Biotechnology':'의료 및 바이오','11-02. Legal & Compliance':'법률 및 컴플라이언스','11-03. Finance & FinTech':'금융 및 핀테크','11-04. Real Estate & Architecture':'부동산 및 건축','11-05. Retail & Logistics':'유통 및 물류','11-06. Agriculture & Smart Farming':'농업 및 스마트팜','11-07. Energy & Climate Tech':'에너지 및 기후 테크',
  '12-01. Humanoid & General-Purpose Robots':'휴머노이드 및 범용 로봇','12-02. Industrial Collaborative Robots':'산업용 협동 로봇','12-03. Autonomous Driving & Mobility':'자율주행 및 모빌리티','12-04. Smart Sensors & Wearables':'스마트 센서 및 웨어러블',
  '13-01. AI Semiconductors & Accelerators':'AI 반도체 및 가속기','13-02. MLOps, Model Serving & Data Ops':'MLOps 및 모델 서빙','13-03. Cybersecurity & Threat Detection':'사이버 보안 및 위협 탐지','13-04. Sovereign AI & Private Cloud':'소버린 AI 및 프라이빗 클라우드',
}

const ICONS: Record<string, string> = {
  '01. Foundation Models':'🧠','02. Search & Knowledge Discovery':'🔍',
  '03. Visual Art & Generative Design':'🎨','04. Video & Motion Synthesis':'🎬',
  '05. Audio & Music Generation':'🎵','06. Development & Coding':'💻',
  '07. Agents & Automation':'🤖','08. Business & Office Productivity':'📊',
  '09. Marketing & Content Creation':'📣','10. Education & Academic':'📚',
  '11. Specialized Industries':'🏭','12. Hardware & Robotics':'⚙️',
  '13. Infrastructure & Security':'🔒',
}

// ── 헤더에서 카테고리 선택 이벤트를 page.tsx로 전달하기 위한 커스텀 이벤트
export function dispatchCategorySelect(main: string, sub: string) {
  window.dispatchEvent(new CustomEvent('aimap:categorySelect', { detail: { main, sub } }))
}

// ── 서브카테고리 패널: 데스크탑=오른쪽 플라이아웃, 모바일=아래 겹침 ──────
function SubMenu({ main, ko, getMainLabel, getSubLabel, onSelect }: {
  main: string
  ko: boolean
  getMainLabel: (k: string) => string
  getSubLabel: (k: string) => string
  onSelect: (m: string, s: string) => void
}) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <div
      style={{
        position: 'absolute',
        // 모바일: 대분류 항목 위에 겹쳐서 표시 (top=0, left=0, 전체 너비)
        // 데스크탑: 오른쪽으로 플라이아웃
        ...(isMobile
          ? { top: 0, left: 0, width: '100%', marginLeft: 0 }
          : { top: '-6px', left: '100%', marginLeft: '6px', width: '260px' }
        ),
        background: 'rgba(10,14,20,0.99)',
        border: '1px solid rgba(0,255,136,0.18)',
        borderRadius: '10px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
        backdropFilter: 'blur(24px)',
        maxHeight: '65vh',
        overflowY: 'auto',
        padding: '6px 0',
        zIndex: 202,
      }}
    >
      {/* 대분류 전체 선택 */}
      <button
        onClick={() => onSelect(main, '')}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          width: '100%', padding: '9px 16px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#00ff88', fontSize: '13px', fontWeight: 700,
          textAlign: 'left', transition: 'background 0.1s',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: '4px',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.08)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
      >
        <span>{ICONS[main]}</span>
        {getMainLabel(main)} — {ko ? '전체' : 'All'}
      </button>

      {/* 서브카테고리 목록 */}
      {CATEGORIES_EN[main].map(sub => (
        <button
          key={sub}
          onClick={() => onSelect(main, sub)}
          style={{
            display: 'block', width: '100%', padding: '8px 16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#8b949e', fontSize: '13px', textAlign: 'left',
            transition: 'all 0.1s', lineHeight: 1.4,
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,212,255,0.08)'
            ;(e.currentTarget as HTMLElement).style.color = '#00d4ff'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'none'
            ;(e.currentTarget as HTMLElement).style.color = '#8b949e'
          }}
        >
          {getSubLabel(sub)}
        </button>
      ))}
    </div>
  )
}

export default function Header() {
  const [hubOpen, setHubOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hoveredMain, setHoveredMain] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { lang, setLang } = useLang()
  const tx = (key: string) => t[key]?.[lang] ?? key
  const ko = lang === 'ko'

  const getMainLabel = (key: string) => ko ? (MAIN_KO[key] ?? key.replace(/^\d+\.\s/, '')) : key.replace(/^\d+\.\s/, '')
  const getSubLabel  = (key: string) => ko ? (SUB_KO[key]  ?? key.replace(/^\d+-\d+\.\s/, '')) : key.replace(/^\d+-\d+\.\s/, '')

  // 메뉴 닫기 (딜레이 — 서브메뉴로 마우스 이동 시 깜빡임 방지)
  const startClose = useCallback(() => {
    closeTimer.current = setTimeout(() => {
      setMenuOpen(false)
      setHoveredMain(null)
    }, 180)
  }, [])

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  function handleCategoryClick(main: string, sub: string) {
    dispatchCategorySelect(main, sub)
    setMenuOpen(false)
    setHoveredMain(null)
  }

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(8,10,15,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* 상단 액센트 라인 */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.5) 50%, transparent 100%)',
        }} />

        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          padding: '0 20px', height: '52px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
        }}>

          {/* ── 왼쪽: 햄버거 + 로고 ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

            {/* 햄버거 버튼 */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => { setMenuOpen(o => !o); setHoveredMain(null) }}
                onMouseLeave={startClose}
                onMouseEnter={cancelClose}
                title={ko ? '카테고리' : 'Categories'}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  alignItems: 'center', gap: '4px',
                  width: '34px', height: '34px', borderRadius: '7px',
                  background: menuOpen ? 'rgba(0,255,136,0.1)' : 'transparent',
                  border: menuOpen ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', transition: 'all 0.15s', padding: 0,
                }}
                onMouseOver={e => {
                  if (!menuOpen) {
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.3)'
                    ;(e.currentTarget as HTMLElement).style.background = 'rgba(0,255,136,0.07)'
                  }
                }}
                onMouseOut={e => {
                  if (!menuOpen) {
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }
                }}
              >
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    display: 'block', width: '16px', height: '1.5px',
                    borderRadius: '2px',
                    background: menuOpen ? 'var(--accent)' : '#8b949e',
                    transition: 'all 0.2s',
                    transform: menuOpen
                      ? i === 0 ? 'translateY(5.5px) rotate(45deg)'
                      : i === 2 ? 'translateY(-5.5px) rotate(-45deg)'
                      : 'scaleX(0)'
                      : 'none',
                  }} />
                ))}
              </button>

              {/* ── 카테고리 드롭다운 메뉴 ── */}
              {menuOpen && (
                <div
                  onMouseEnter={cancelClose}
                  onMouseLeave={startClose}
                  style={{
                    position: 'absolute', top: '42px', left: 0,
                    zIndex: 200,
                    background: 'rgba(10,14,20,0.98)',
                    border: '1px solid rgba(0,255,136,0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,136,0.05)',
                    backdropFilter: 'blur(24px)',
                    minWidth: '240px',
                    overflow: 'visible',
                    padding: '6px 0',
                  }}
                >
                  {/* All 버튼 */}
                  <button
                    onClick={() => handleCategoryClick('', '')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      width: '100%', padding: '9px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#00ff88', fontSize: '13px', fontWeight: 700,
                      textAlign: 'left', transition: 'background 0.1s',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '4px',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize: '14px' }}>✦</span>
                    {ko ? '전체 보기' : 'View All'}
                  </button>

                  {/* 대분류 목록 */}
                  {Object.keys(CATEGORIES_EN).map(main => (
                    <div
                      key={main}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => { cancelClose(); setHoveredMain(main) }}
                      onMouseLeave={() => setHoveredMain(null)}
                    >
                      <button
                        onClick={() => {
                          // 모바일: 클릭으로 서브메뉴 토글 / 데스크탑: 바로 카테고리 이동
                          if (typeof window !== 'undefined' && window.innerWidth < 768) {
                            setHoveredMain(prev => prev === main ? null : main)
                          } else {
                            handleCategoryClick(main, '')
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          justifyContent: 'space-between',
                          width: '100%', padding: '10px 16px',
                          background: hoveredMain === main ? 'rgba(0,255,136,0.07)' : 'none',
                          border: 'none', cursor: 'pointer',
                          color: hoveredMain === main ? '#e6edf3' : '#8b949e',
                          fontSize: '13px', textAlign: 'left',
                          transition: 'all 0.1s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '15px', width: '20px', textAlign: 'center' }}>{ICONS[main]}</span>
                          {getMainLabel(main)}
                        </span>
                        <span style={{
                          color: hoveredMain === main ? '#00ff88' : '#444',
                          fontSize: '12px',
                          transform: hoveredMain === main ? 'rotate(90deg)' : 'none',
                          transition: 'all 0.15s',
                          display: 'inline-block',
                        }}>›</span>
                      </button>

                      {/* ── 서브카테고리: 데스크탑=오른쪽, 모바일=아래 겹침 ── */}
                      {hoveredMain === main && (
                        <SubMenu main={main} ko={ko} getMainLabel={getMainLabel} getSubLabel={getSubLabel} onSelect={handleCategoryClick} />
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 로고 */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--accent)', letterSpacing: '2px' }}>AI</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: '#e6edf3', letterSpacing: '2px' }}>MAP</span>
              </div>
              <span style={{
                fontSize: '9px', fontFamily: 'monospace', fontWeight: 700,
                color: 'var(--accent)', letterSpacing: '1px',
                padding: '1px 5px', borderRadius: '3px',
                border: '1px solid rgba(0,255,136,0.3)',
                background: 'rgba(0,255,136,0.08)',
                animation: 'pulse-glow 2.5s ease-in-out infinite',
              }}>LIVE</span>
            </Link>
          </div>

          {/* ── 중앙: DOI 배지 (데스크탑, 링크 없음 — Zenodo 계정 복구 후 링크 재연결) ── */}
          <div
            className="hidden md:inline-flex"
            style={{
              alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '99px',
              background: 'rgba(0,255,136,0.05)',
              border: '1px solid rgba(0,255,136,0.12)',
              color: '#00cc6a', fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ opacity: 0.5, fontSize: '10px' }}>📄 DOI</span>
            10.5281/zenodo.20248631
          </div>

          {/* ── 우측: 네비 (데스크탑 + 모바일 통합, 중복 제거) ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

            {/* Explore / Request — 데스크탑만 */}
            <Link href="/" className="hidden md:inline-flex" style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
              color: '#8b949e', textDecoration: 'none', transition: 'color 0.15s',
              alignItems: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >{tx('navExplore')}</Link>

            <Link href="/request" className="hidden md:inline-flex" style={{
              padding: '5px 12px', borderRadius: '6px', fontSize: '12px',
              color: '#8b949e', textDecoration: 'none', transition: 'color 0.15s',
              alignItems: 'center',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8b949e')}
            >{tx('navRequest')}</Link>

            {/* Serial Auth */}
            <Link href="/auth" style={{
              padding: '5px 14px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 700, color: '#000',
              background: 'var(--accent)',
              textDecoration: 'none', transition: 'all 0.15s',
              marginLeft: '4px',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.background = '#00ff99'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(0,255,136,0.4)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--accent)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
            }}
            >{tx('navAuth')}</Link>

            {/* 언어 전환 — 하나만 */}
            <button
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                fontFamily: 'monospace', fontWeight: 700,
                color: 'var(--accent)',
                background: 'rgba(0,255,136,0.07)',
                border: '1px solid rgba(0,255,136,0.2)',
                cursor: 'pointer', marginLeft: '4px',
              }}
            >{lang === 'ko' ? 'EN' : 'KO'}</button>

            {/* 링크 허브 ☰ — 하나만 */}
            <button
              onClick={() => setHubOpen(true)}
              title={lang === 'ko' ? '링크 허브' : 'Link Hub'}
              style={{
                padding: '5px 8px', borderRadius: '6px', fontSize: '16px',
                color: '#8b949e', background: 'transparent',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', marginLeft: '4px',
                transition: 'all 0.15s', lineHeight: 1,
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.3)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.color = '#8b949e'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >☰</button>
          </nav>
        </div>
      </header>

      {/* 링크 허브 드로어 */}
      {hubOpen && <LinkHub onClose={() => setHubOpen(false)} />}
    </>
  )
}
